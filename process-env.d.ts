declare module NodeJS {
    /**
     * The `ProcessEnv` interface represents the environment variables available to the Node.js process.
     * Each key-value pair is represented by a property with the name of the environment variable.
     */
    interface ProcessEnv {
        /**
         * Comma-separated list of AWS regions where the CDK stack will be deployed.
         */
        [key: string]: string | undefined;
        CDK_DEPLOY_REGIONS: string;
        /**
         * Comma-separated list of environments (e.g., "development,production").
         */
        ENVIRONMENTS: string;
        /**
         * Name of the ECR repository.
         */
        ECR_REPOSITORY_NAME: string;
        /**
         * Name of the application.
         */
        APP_NAME: string;
        /**
         * Comma-separated list of platforms (e.g., "linux/amd64,linux/arm64").
         */
        PLATFORMS: string;
        /**
         * File path for the root of the EFS file system.
         */
        EFS_ROOT_FILE_PATH: string;
        /**
         * File path for the root of the application.
         */
        APP_ROOT_FILE_PATH: string;
        /**
         * Port number on which the application will run.
         */
        PORT: string;
    }
}
