#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { QdrantDockerImageEcrDeploymentCdkStack } from '../lib/qdrant-docker-image-ecr-deployment-cdk-stack';

dotenv.config(); // Load environment variables from .env file
const app = new cdk.App();

const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env;

const cdkRegions = process.env.CDK_DEPLOY_REGIONS?.split(',') ?? [region]; // Parsing comma separated list of regions
const deployEnvironments = process.env.ENVIRONMENTS?.split(',') ?? ['dev']; // Parsing comma separated list of environments

const DEFAULT_IMAGE_VERSION = 'latest';

/*
 * Check if the environment variables are set
 * @param args - Environment variables to check
 * @throws Error if any of the environment variables is not set
 * @returns void
 * */
function checkEnvVariables(...args: string[]) {
    args.forEach((arg) => {
        if (!process.env[arg]) {
            throw new Error(`Environment variable ${arg} is not set yet. Please set it in .env file.`);
        }
    });
}

// check if the environment variables are set
checkEnvVariables('ECR_REPOSITORY_NAME', 'APP_NAME');

for (const cdkRegion of cdkRegions) {
    for (const environment of deployEnvironments) {
        new QdrantDockerImageEcrDeploymentCdkStack(app, `QdrantDockerImageEcrDeploymentCdkStack-${cdkRegion}-${environment}`, {
            env: {
                account,
                region: cdkRegion,
            },
            tags: {
                environment,
            },
            repositoryName: `${process.env.ECR_REPOSITORY_NAME}-${environment}`,
            appName: process.env.APP_NAME,
            imageVersion: process.env.IMAGE_VERSION ?? DEFAULT_IMAGE_VERSION,
            environment: environment
        });
    }
}

app.synth();
