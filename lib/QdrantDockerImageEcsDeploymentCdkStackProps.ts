import { QdrantDockerImageEcrDeploymentCdkStackProps } from './QdrantDockerImageEcrDeploymentCdkStackProps';

export interface QdrantDockerImageEcsDeploymentCdkStackProps extends QdrantDockerImageEcrDeploymentCdkStackProps {
    readonly platformString: string;
    readonly appRootFilePath: string;
    readonly vectorDatabasePort: number;
    readonly deployRegion: string | undefined;
}
