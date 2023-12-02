# Qdrant Vector Database - Docker Image ECR Deployment CDK

This repository contains the AWS CDK infrastructure code for deploying the Qdrant vector database Docker image to Amazon ECR.

## Overview

The CDK stack defined in this repository handles the deployment of the Qdrant Docker image to an AWS ECR repository. It includes the necessary resources and configurations to pull the image from the Qdrant Docker registry and push it to the specified AWS ECR repository.

## Prerequisites

Before you can use this CDK stack, you must have the following prerequisites set up:

- AWS account with appropriate permissions to create and manage AWS resources
- AWS CLI configured with access keys
- Node.js and npm installed
- AWS CDK installed

## Configuration

The deployment can be configured using environment variables. The following variables are used:

- `CDK_DEPLOY_REGIONS`: Comma-separated list of AWS regions where the ECR repository will be deployed (e.g., `us-east-1,eu-west-1`).
- `ENVIRONMENTS`: Comma-separated list of environments for the deployment (e.g., `dev,stg,prod`).
- `ECR_REPOSITORY_NAME`: Name of the ECR repository where the Docker image will be stored.
- `APP_NAME`: Name of the application, used for naming the stack and resources.
- `IMAGE_VERSION`: Version tag for the Docker image (default is `latest`).

## Deployment

To deploy the stack, run the following commands:

1. Install dependencies:

   ```sh
   npm install
   ```

2. Build the TypeScript files:

   ```sh
   npm run build
   ```

3. Deploy the stack:

   ```sh
   npx cdk deploy
   ```

## Structure

- `bin/qdrant-docker-image-ecr-deployment-cdk.ts`: Entry point for the CDK application.
- `lib/qdrant-docker-image-ecr-deployment-cdk-stack.ts`: CDK stack definition for deploying the Docker image to ECR.
- `package.json` & `package-lock.json`: Node.js package configuration and dependency lock file.
- `tsconfig.json`: TypeScript compiler configuration.

## License

The code in this repository is provided as-is, with no explicit license specified.

## Contributing

If you wish to contribute to this project, please open an issue or submit a pull request with your proposed changes or enhancements.

## Support

For support or questions regarding this repository, please open an issue on the GitHub repository page.

## Disclaimer

This is a sample CDK stack for educational purposes. It is not an official AWS or Qdrant project. Please use it at your own risk.
