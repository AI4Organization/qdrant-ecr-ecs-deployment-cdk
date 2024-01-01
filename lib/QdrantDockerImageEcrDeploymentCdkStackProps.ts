import * as cdk from 'aws-cdk-lib';

/**
 * Properties for the Qdrant Docker Image ECR Deployment CDK Stack.
 * This interface extends the base CDK StackProps and includes properties specific to the Qdrant Docker image deployment.
 */
export interface QdrantDockerImageEcrDeploymentCdkStackProps extends cdk.StackProps {
  /**
   * The name of the ECR repository where the Docker images will be stored.
   */
  readonly repositoryName: string;
  /**
   * The name of the application associated with the deployment.
   */
  readonly appName: string;
  /**
   * The version tag for the Docker image to be deployed.
   */
  readonly imageVersion: string;
  /**
   * The deployment environment (e.g., 'development', 'production').
   */
  readonly environment: string;
}
