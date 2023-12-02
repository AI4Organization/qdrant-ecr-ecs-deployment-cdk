import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecrDeploy from 'cdk-ecr-deployment';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { QdrantDockerImageEcrDeploymentCdkStackProps } from './QdrantDockerImageEcrDeploymentCdkStackProps';

export class QdrantDockerImageEcrDeploymentCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: QdrantDockerImageEcrDeploymentCdkStackProps) {
        super(scope, id, props);

        const ecrRepository = new ecr.Repository(this, `${props.appName}-${props.environment}-DockerImageEcrRepository`, {
            repositoryName: props.repositoryName,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encryption: ecr.RepositoryEncryption.AES_256
        });

        ecrRepository.addLifecycleRule({ maxImageAge: cdk.Duration.days(7), rulePriority: 1, tagStatus: ecr.TagStatus.UNTAGGED }); // delete images older than 7 days
        ecrRepository.addLifecycleRule({ maxImageCount: 4, rulePriority: 2, tagStatus: ecr.TagStatus.ANY }); // keep last 4 images

        // Copy from docker registry to ECR.
        new ecrDeploy.ECRDeployment(this, `${props.appName}-${props.environment}-DockerImageEcrDeployment`, {
            src: new ecrDeploy.DockerImageName('qdrant/qdrant:latest'),
            dest: new ecrDeploy.DockerImageName(`${ecrRepository.repositoryUri}:${props.imageVersion}`),
        });
    }
}
