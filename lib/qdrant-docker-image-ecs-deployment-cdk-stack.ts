import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancedCodeDeployedFargateService } from '@cdklabs/cdk-ecs-codedeploy';
import { QdrantDockerImageEcsDeploymentCdkStackProps } from './QdrantDockerImageEcsDeploymentCdkStackProps';
import { createVPC } from './qdrant-vpc-deployment';

export class QdrantDockerImageEcsDeploymentCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: QdrantDockerImageEcsDeploymentCdkStackProps) {
        super(scope, id, props);

        const qdrantVpc = createVPC(this, props);

        const imageVersion = props.imageVersion;
        console.log(`imageVersion: ${imageVersion}`);

        const ecsContainerImage = ecs.ContainerImage.fromRegistry(`qdrant/qdrant:v${imageVersion}`);

        // define a cluster with spot instances, linux type
        const ecsCluster = new ecs.Cluster(this, `${props.appName}-${props.environment}-${props.platformString}-Cluster`, {
            clusterName: `${props.appName}-${props.environment}-${props.platformString}-Cluster`,
            vpc: qdrantVpc,
            containerInsights: true,
        });

        // define a security group for EFS
        const qdrantEfsSG = new ec2.SecurityGroup(this, `${props.appName}-${props.environment}-${props.platformString}-EFS-SG`, {
            securityGroupName: `${props.appName}-${props.environment}-${props.platformString}-EFS-SG`,
            vpc: qdrantVpc,
        });

        qdrantEfsSG.addIngressRule(
            qdrantEfsSG,
            ec2.Port.tcp(2049) // Enable NFS service within security group
        );

        // create Fargate Task Definition with EFS volume
        const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, `${props.appName}-${props.environment}-${props.platformString}-TaskDef`, {
            memoryLimitMiB: 2048,
            cpu: 1024,
            ephemeralStorageGiB: 40,
            runtimePlatform: {
                cpuArchitecture: props.platformString === `arm` ? ecs.CpuArchitecture.ARM64 : ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            }
        });

        // define a container with the image
        const qdrantContainer = fargateTaskDefinition.addContainer(`${props.appName}-${props.environment}-${props.platformString}-QdrantContainer`, {
            image: ecsContainerImage,
            logging: ecs.LogDrivers.awsLogs({ streamPrefix: `${props.appName}-${props.environment}-${props.platformString}-QdrantService` }),
        });

        // add port mapping
        qdrantContainer.addPortMappings({
            containerPort: props.vectorDatabasePort,
            protocol: ecs.Protocol.TCP
        });

        // create an EFS File System
        const efsFileSystem = new efs.FileSystem(this, `${props.appName}-${props.environment}-${props.platformString}-QdrantServiceEfsFileSystem`, {
            fileSystemName: `${props.appName}-${props.environment}-${props.platformString}-QdrantServiceEfsFileSystem`,
            vpc: qdrantVpc,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            securityGroup: qdrantEfsSG,
            encrypted: true, // Enable encryption at rest
            performanceMode: efs.PerformanceMode.MAX_IO, // For AI application, HCP application, Analytics application, and media processing workflows
            allowAnonymousAccess: false, // Disable anonymous access
            throughputMode: efs.ThroughputMode.BURSTING,
            lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS, // After 2 weeks, if a file is not accessed for given days, it will move to EFS Infrequent Access.
        });

        const efsVolumeName = `${props.appName}-${props.environment}-${props.platformString}-QdrantEfsVolume`;

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
            containerPath: props.appRootFilePath, // The path on the container to mount the host volume at.
            readOnly: false, // Allow the container to write to the EFS volume.
        });

        const fargateService = new ApplicationLoadBalancedCodeDeployedFargateService(this, `${props.appName}-${props.environment}-${props.platformString}-FargateService`, {
            cluster: ecsCluster,
            taskDefinition: fargateTaskDefinition,
            desiredCount: 1,
            publicLoadBalancer: true,
            openListener: true,
            platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
            securityGroups: [qdrantEfsSG],
        });

        // print out fargateService dns name
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.platformString}-FargateServiceDns`, {
            value: fargateService.loadBalancer.loadBalancerDnsName,
            exportName: `${props.appName}-${props.environment}-${props.platformString}-FargateServiceDns`,
        });
    }
}
