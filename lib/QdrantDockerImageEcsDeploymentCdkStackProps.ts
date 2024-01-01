import { QdrantDockerImageEcrDeploymentCdkStackProps } from './QdrantDockerImageEcrDeploymentCdkStackProps';

/**
 * Properties for the Qdrant Docker Image ECS Deployment CDK Stack.
 * This interface extends `QdrantDockerImageEcrDeploymentCdkStackProps` with additional properties
 * required for deploying the Docker image to an Amazon ECS cluster.
 */
export interface QdrantDockerImageEcsDeploymentCdkStackProps extends QdrantDockerImageEcrDeploymentCdkStackProps {
    /**
     * The platform string indicating the CPU architecture, e.g., 'arm' or 'x86_64'.
     */
    readonly platformString: string;
    /**
     * The file path for the root of the application within the Docker container.
     */
    readonly appRootFilePath: string;
    /**
     * The port number on which the Qdrant vector database service will be available.
     */
    readonly vectorDatabasePort: number;
    /**
     * The AWS region where the deployment will occur. This is optional and can be undefined.
     */
    readonly deployRegion: string | undefined;
}
