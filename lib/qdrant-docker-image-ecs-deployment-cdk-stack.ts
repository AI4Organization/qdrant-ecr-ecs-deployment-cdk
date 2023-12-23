import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import { ApplicationLoadBalancedCodeDeployedFargateService } from '@cdklabs/cdk-ecs-codedeploy';
import { QdrantDockerImageEcsDeploymentCdkStackProps } from './QdrantDockerImageEcsDeploymentCdkStackProps';

export class QdrantDockerImageEcsDeploymentCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: QdrantDockerImageEcsDeploymentCdkStackProps) {
        super(scope, id, props);

        const ecrRepositoryName = props.repositoryName;
        console.log(`ecrRepositoryName: ${ecrRepositoryName}`);
        const ecrRepository = ecr.Repository.fromRepositoryName(this, `${props.appName}-${props.environment}-${props.platformString}-ERCRepository`, ecrRepositoryName);
        // const ecsContainerImage = ecs.ContainerImage.fromEcrRepository(ecrRepository, props.imageVersion);
        const ecsContainerImage = ecs.ContainerImage.fromRegistry(`qdrant/qdrant:${props.imageVersion}`);

        // define a cluster with spot instances, linux type
        const cluster = new ecs.Cluster(this, `${props.appName}-${props.environment}-${props.platformString}-Cluster`, {
            clusterName: `${props.appName}-${props.environment}-${props.platformString}-Cluster`,
        });

        // Create Task Definition
        const backendTaskDefinition = new ecs.FargateTaskDefinition(
            this,
            `${props.appName}-${props.environment}-${props.platformString}-TaskDefinition`,
        );

        const fargateContainer = backendTaskDefinition.addContainer(`${props.appName}-${props.environment}-${props.platformString}-Container`, {
            image: ecsContainerImage,
            containerName: `${props.appName}-${props.environment}-${props.platformString}-Container`,
        });
        fargateContainer.addPortMappings({
            containerPort: 80,
            protocol: ecs.Protocol.TCP,
        });

        const fargateService = new ApplicationLoadBalancedCodeDeployedFargateService(this, `${props.appName}-${props.environment}-${props.platformString}-FargateService`, {
            cluster,
            taskDefinition: backendTaskDefinition,
            desiredCount: 1,
            cpu: 2048,
            memoryLimitMiB: 4096,
            publicLoadBalancer: true,
            openListener: true,
            platformVersion: ecs.FargatePlatformVersion.LATEST,
            runtimePlatform: {
                cpuArchitecture: props.platformString === `arm` ? ecs.CpuArchitecture.ARM64 : ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            },
        });

        // print out fargateService dns name
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.platformString}-FargateServiceDns`, {
            value: fargateService.loadBalancer.loadBalancerDnsName,
            exportName: `${props.appName}-${props.environment}-${props.platformString}-FargateServiceDns`,
        });
    }
}
