import * as cdk from 'aws-cdk-lib';

export interface QdrantDockerImageEcrDeploymentCdkStackProps extends cdk.StackProps {
  readonly repositoryName: string;
  readonly appName: string;
  readonly imageVersion: string;
  readonly environment: string;
}
