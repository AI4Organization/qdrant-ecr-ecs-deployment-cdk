import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { ApplicationLoadBalancedCodeDeployedFargateService } from '@cdklabs/cdk-ecs-codedeploy';
import { QdrantDockerImageEcsDeploymentCdkStackProps } from './QdrantDockerImageEcsDeploymentCdkStackProps';
import { createVPC } from './qdrant-vpc-deployment';

export class QdrantDockerImageEcsDeploymentCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: QdrantDockerImageEcsDeploymentCdkStackProps) {
        super(scope, id, props);

        const qrantVpc = createVPC(this, props);

        const imageVersion = props.imageVersion;
        console.log(`imageVersion: ${imageVersion}`);

        const ecsContainerImage = ecs.ContainerImage.fromRegistry(`qdrant/qdrant:v${imageVersion}`);

        // define a cluster with spot instances, linux type
        const cluster = new ecs.Cluster(this, `${props.appName}-${props.environment}-${props.platformString}-Cluster`, {
            clusterName: `${props.appName}-${props.environment}-${props.platformString}-Cluster`,
            vpc: qrantVpc,
            containerInsights: true,
        });

        const fargateService = new ApplicationLoadBalancedCodeDeployedFargateService(this, `${props.appName}-${props.environment}-${props.platformString}-FargateService`, {
            cluster,
            taskImageOptions: {
                image: ecsContainerImage,
                containerName: `${props.appName}-${props.environment}-${props.platformString}-Container`,
                containerPort: props.vectorDatabasePort,
            },
            desiredCount: 1,
            cpu: 2048,
            memoryLimitMiB: 4096,
            publicLoadBalancer: true,
            openListener: true,
            platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
            runtimePlatform: {
                cpuArchitecture: props.platformString === `arm` ? ecs.CpuArchitecture.ARM64 : ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            }
        });

        // print out fargateService dns name
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.platformString}-FargateServiceDns`, {
            value: fargateService.loadBalancer.loadBalancerDnsName,
            exportName: `${props.appName}-${props.environment}-${props.platformString}-FargateServiceDns`,
        });
    }
}
