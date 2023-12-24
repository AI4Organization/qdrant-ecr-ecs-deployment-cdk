import { QdrantDockerImageEcrDeploymentCdkStackProps } from './QdrantDockerImageEcrDeploymentCdkStackProps';

export interface QdrantDockerImageEcsDeploymentCdkStackProps extends QdrantDockerImageEcrDeploymentCdkStackProps {
    readonly platformString: string;
    readonly appRootFilePath: string;
}
