import * as kms from 'aws-cdk-lib/aws-kms';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecrDeploy from 'cdk-ecr-deployment';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { QdrantDockerImageEcrDeploymentCdkStackProps } from './QdrantDockerImageEcrDeploymentCdkStackProps';

export class QdrantDockerImageEcrDeploymentCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: QdrantDockerImageEcrDeploymentCdkStackProps) {
        super(scope, id, props);

        const kmsKey = new kms.Key(this, `${props.appName}-ECRRepositoryKmsKey`, {
            enableKeyRotation: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            enabled: true,
        });

        const ecrRepository = new ecr.Repository(this, `${props.appName}-QdrantDockerImageEcrRepository`, {
            repositoryName: props?.repositoryName ?? 'qdrant-docker-image-ecr-kms-deployment-cdk',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encryption: ecr.RepositoryEncryption.KMS,
            encryptionKey: kmsKey,
        });

        ecrRepository.addLifecycleRule({ maxImageCount: 4, rulePriority: 1 }); // keep last 4 images
        ecrRepository.addLifecycleRule({ maxImageAge: cdk.Duration.days(7), rulePriority: 2 }); // delete images older than 7 days

        // Copy from docker registry to ECR.
        new ecrDeploy.ECRDeployment(this, `${props.appName}-QdrantDockerImageEcrDeployment`, {
            src: new ecrDeploy.DockerImageName('qdrant/qdrant:latest'),
            dest: new ecrDeploy.DockerImageName(`${ecrRepository.repositoryUri}:${props.imageVersion}`),
        });
    }
}
