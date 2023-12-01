import * as cdk from 'aws-cdk-lib';

// import * as sqs from 'aws-cdk-lib/aws-sqs';
export interface QdrantDockerImageEcrDeploymentCdkStackProps extends cdk.StackProps {
  readonly repositoryName: string;
  readonly appName: string;
  imageVersion?: string;
}
