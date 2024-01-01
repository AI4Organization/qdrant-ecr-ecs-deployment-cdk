export interface IEnvTypes {
    /**
     * Name of the ECR repository where the Docker images are stored.
     */
    readonly ECR_REPOSITORY_NAME: string;
    /**
     * Name of the application that is being deployed.
     */
    readonly APP_NAME: string;
    /**
     * Optional version tag for the Docker image.
     */
    readonly IMAGE_VERSION?: string;
    /**
     * Comma-separated list of platforms for which the Docker image is built.
     * Example: "linux/amd64,linux/arm64"
     */
    readonly PLATFORMS: string;
    /**
     * Optional file path for the root of the EFS file system.
     */
    readonly EFS_ROOT_FILE_PATH?: string;
    /**
     * File path for the root of the application within the Docker container.
     */
    readonly APP_ROOT_FILE_PATH: string;
}
