import * as kms from 'aws-cdk-lib/aws-kms';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecrDeploy from 'cdk-ecr-deployment';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { QdrantDockerImageEcrDeploymentCdkStackProps } from './QdrantDockerImageEcrDeploymentCdkStackProps';
import { LATEST_IMAGE_VERSION } from '../bin/qdrant-docker-image-ecr-deployment-cdk';

export class QdrantDockerImageEcrDeploymentCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: QdrantDockerImageEcrDeploymentCdkStackProps) {
        super(scope, id, props);

        const kmsKey = new kms.Key(this, `${props.appName}-${props.environment}-ECRRepositoryKmsKey`, {
            enableKeyRotation: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            enabled: true,
        });

        const ecrRepository = new ecr.Repository(this, `${props.appName}-${props.environment}-DockerImageEcrRepository`, {
            repositoryName: props.repositoryName,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteImages: true,
            encryption: ecr.RepositoryEncryption.KMS,
            encryptionKey: kmsKey,
        });

        ecrRepository.addLifecycleRule({ maxImageAge: cdk.Duration.days(7), rulePriority: 1, tagStatus: ecr.TagStatus.UNTAGGED }); // delete images older than 7 days
        ecrRepository.addLifecycleRule({ maxImageCount: 4, rulePriority: 2, tagStatus: ecr.TagStatus.ANY }); // keep last 4 images

        const deployImageVersions = props.imageVersion === LATEST_IMAGE_VERSION ? props.imageVersion : [props.imageVersion, LATEST_IMAGE_VERSION];
        for (const deployImageVersion of deployImageVersions) {
            // Copy from docker registry to ECR.
            new ecrDeploy.ECRDeployment(this, `${props.appName}-${props.environment}-${deployImageVersion}-ECRDeployment`, {
                src: new ecrDeploy.DockerImageName('qdrant/qdrant:latest'),
                dest: new ecrDeploy.DockerImageName(`${ecrRepository.repositoryUri}:${deployImageVersion}`),
            });
        }

        // print out ecrRepository arn
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-ECRRepositoryArn`, {
            value: ecrRepository.repositoryArn,
            exportName: `${props.appName}-${props.environment}-ECRRepositoryArn`,
        });
    }
}
