import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ApplicationLoadBalancedCodeDeployedFargateService } from '@cdklabs/cdk-ecs-codedeploy';
import { QdrantDockerImageEcsDeploymentCdkStackProps } from './QdrantDockerImageEcsDeploymentCdkStackProps';
import { createVPC } from './qdrant-vpc-deployment';

export class QdrantDockerImageEcsDeploymentCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: QdrantDockerImageEcsDeploymentCdkStackProps) {
        super(scope, id, props);

        const qdrantVpc = createVPC(this, props);

        const imageVersion = props.imageVersion;
        console.log(`imageVersion: ${imageVersion}`);

        const ecsContainerImage = ecs.ContainerImage.fromRegistry(`qdrant/qdrant:${imageVersion}`);

        // define a cluster with spot instances, linux type
        const ecsCluster = new ecs.Cluster(this, `${props.environment}-${props.platformString}-Cluster`, {
            clusterName: `${props.environment}-${props.platformString}-Cluster`,
            vpc: qdrantVpc,
            containerInsights: true,
        });

        // define a security group for EFS
        const qdrantEfsSG = new ec2.SecurityGroup(this, `${props.environment}-${props.platformString}-EFS-SG`, {
            securityGroupName: `${props.environment}-${props.platformString}-EFS-SG`,
            vpc: qdrantVpc,
        });

        qdrantEfsSG.addIngressRule(
            // ec2.Peer.ipv4(qdrantVpc.vpcCidrBlock)
            qdrantEfsSG,
            ec2.Port.tcp(2049),
            'Allow NFS traffic from the ECS tasks.'
        );

        qdrantEfsSG.addIngressRule(
            // ec2.Peer.ipv4(qdrantVpc.vpcCidrBlock),
            qdrantEfsSG,
            ec2.Port.tcp(props.vectorDatabasePort),
            'Allow Qdrant traffic from the VPC.'
        );

        // create an EFS File System
        const efsFileSystem = new efs.FileSystem(this, `${props.environment}-${props.platformString}-QdrantServiceEfsFileSystem`, {
            fileSystemName: `${props.environment}-${props.platformString}-QdrantServiceEfsFileSystem`,
            vpc: qdrantVpc,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            securityGroup: qdrantEfsSG, // Ensure this security group allows NFS traffic from the ECS tasks
            encrypted: true, // Enable encryption at rest
            performanceMode: efs.PerformanceMode.MAX_IO, // For AI application, HCP application, Analytics application, and media processing workflows
            allowAnonymousAccess: false, // Disable anonymous access
            throughputMode: efs.ThroughputMode.BURSTING,
            lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS, // After 2 weeks, if a file is not accessed for given days, it will move to EFS Infrequent Access.
        });

        // add EFS access policy
        efsFileSystem.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['elasticfilesystem:ClientMount'],
                principals: [new iam.AnyPrincipal()],
                conditions: {
                    Bool: {
                        'elasticfilesystem:AccessedViaMountTarget': 'true'
                    }
                },
            }),
        );

        // create Fargate Task Definition with EFS volume
        const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, `${props.environment}-${props.platformString}-TaskDef`, {
            memoryLimitMiB: 2048,
            cpu: 1024,
            ephemeralStorageGiB: 40,
            runtimePlatform: {
                cpuArchitecture: props.platformString === `arm` ? ecs.CpuArchitecture.ARM64 : ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            },
            executionRole: new iam.Role(this, `${props.environment}-${props.platformString}-TaskExecutionRole`, {
                assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
                managedPolicies: [
                    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
                ],
                roleName: `${props.environment}-${props.platformString}-TaskExecutionRole`,
                inlinePolicies: {
                    efsAccess: new cdk.aws_iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                effect: iam.Effect.ALLOW,
                                actions: [
                                    'elasticfilesystem:ClientMount',
                                    'elasticfilesystem:ClientWrite',
                                    'elasticfilesystem:DescribeMountTargets',
                                    'elasticfilesystem:ClientRootAccess',
                                    'elasterfilesystem:ClientRead',
                                    'elasticfilesystem:DescribeFileSystems',
                                ],
                                resources: [efsFileSystem.fileSystemArn],
                            })
                        ],
                    }),
                }
            }),
            taskRole: new iam.Role(this, `${props.environment}-${props.platformString}-TaskRole`, {
                // define a role for the task to access EFS with mount, read, write permissions
                assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
                managedPolicies: [
                    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
                ],
                roleName: `${props.environment}-${props.platformString}-TaskRole`,
                inlinePolicies: {
                    efsAccess: new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                effect: iam.Effect.ALLOW,
                                actions: [
                                    'elasticfilesystem:ClientMount',
                                    'elasticfilesystem:ClientWrite',
                                    'elasticfilesystem:DescribeMountTargets',
                                    'elasticfilesystem:ClientRootAccess',
                                    'elasticfilesystem:ClientRead',
                                    'elasticfilesystem:DescribeFileSystems',
                                ],
                                resources: [efsFileSystem.fileSystemArn],
                            }),
                        ],
                    }),
                },
            }),
        });

        // define a container with the image
        const qdrantContainer = fargateTaskDefinition.addContainer(`${props.environment}-${props.platformString}-QdrantContainer`, {
            image: ecsContainerImage,
            logging: ecs.LogDrivers.awsLogs({ streamPrefix: `${props.environment}-${props.platformString}-QdrantService` }),
            containerName: `${props.environment}-${props.platformString}-QdrantContainer`,
        });

        // add port mapping
        qdrantContainer.addPortMappings({
            containerPort: props.vectorDatabasePort, // The port on the container to which the listener forwards traffic
            protocol: ecs.Protocol.TCP
        });

        const efsVolumeName = props.appRootFilePath;

        // add EFS volume to the task definition
        fargateTaskDefinition.addVolume({
            name: efsVolumeName, // This name is referenced in the sourceVolume parameter of container definition mountPoints.
            efsVolumeConfiguration: {
                fileSystemId: efsFileSystem.fileSystemId,
            },
        });

        // mount EFS to the container
        qdrantContainer.addMountPoints({
            sourceVolume: efsVolumeName, // The name of the volume to mount. Must be a volume name referenced in the name parameter of task definition volume.
            containerPath: `/${efsVolumeName}`, // The path on the container to mount the host volume at.
            readOnly: false, // Allow the container to write to the EFS volume.
        });

        const albFargateService = new ApplicationLoadBalancedCodeDeployedFargateService(this, `${props.environment}-${props.platformString}-FargateService`, {
            cluster: ecsCluster,
            taskDefinition: fargateTaskDefinition,
            desiredCount: 1,
            publicLoadBalancer: true,
            platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
            securityGroups: [qdrantEfsSG],
            listenerPort: 80, // The port on which the listener listens for incoming traffic
        });

        // set deregistration delay to 30 seconds
        albFargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30');

        // allow access to EFS from Fargate ECS
        efsFileSystem.grantRootAccess(albFargateService.taskDefinition.taskRole.grantPrincipal);
        efsFileSystem.connections.allowDefaultPortFrom(albFargateService.service.connections);

        // print out fargateService dns name
        new cdk.CfnOutput(this, `${props.environment}-${props.platformString}-FargateServiceDns`, {
            value: albFargateService.loadBalancer.loadBalancerDnsName,
            exportName: `${props.environment}-${props.platformString}-FargateServiceDns`,
        });

        // print out fargateService service url
        new cdk.CfnOutput(this, `${props.environment}-${props.platformString}-FargateServiceUrl`, {
            value: `http://${albFargateService.loadBalancer.loadBalancerDnsName}`,
            exportName: `${props.environment}-${props.platformString}-FargateServiceUrl`,
        });
    }
}
