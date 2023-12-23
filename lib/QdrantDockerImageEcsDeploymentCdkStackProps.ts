import { QdrantDockerImageEcrDeploymentCdkStackProps } from './QdrantDockerImageEcrDeploymentCdkStackProps';

export interface QdrantDockerImageEcsDeploymentCdkStackProps extends QdrantDockerImageEcrDeploymentCdkStackProps {
    platformString: string;
}
