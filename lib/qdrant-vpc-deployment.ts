import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { FlowLogTrafficType } from "aws-cdk-lib/aws-ec2";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { QdrantDockerImageEcsDeploymentCdkStackProps } from "./QdrantDockerImageEcsDeploymentCdkStackProps";

/**
 * Creates a VPC with public and private subnets, NAT gateways, and VPC flow logs.
 *
 * @param {cdk.Stack} stack - The parent CDK stack.
 * @param {QdrantDockerImageEcsDeploymentCdkStackProps} props - Properties for VPC creation.
 * @returns {ec2.Vpc} The created VPC.
 */
export function createVPC(stack: cdk.Stack, props: QdrantDockerImageEcsDeploymentCdkStackProps): ec2.Vpc {
    const vpcName = `${props.appName}-VPC`;
    const cxVpc = new ec2.Vpc(stack, vpcName, {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), //IPs in Range - 65,536
        natGateways: 1,
        maxAzs: 3, // for high availability
        subnetConfiguration: [
            {
                name: "Public",
                subnetType: ec2.SubnetType.PUBLIC,
                cidrMask: 24, //IPs in Range - 256
            },
            {
                name: "Private",
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                cidrMask: 24, //IPs in Range - 256
            },
        ],
    });

    const vpcFlowLogRole = new iam.Role(stack, `${props.appName}-${props.environment}-RoleVpcFlowLogs`, {
        assumedBy: new iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
        ],
    });

    const vpcFlowLogGroup = new logs.LogGroup(stack, `${props.appName}-${props.environment}-VpcFlowLogGroup`, {
        retention: RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogStream(stack, `${props.appName}-${props.environment}-VpcFlowLogStream`, {
        logGroup: vpcFlowLogGroup,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(stack, `${props.appName}-${props.environment}-VpcFlowLog`, {
        resourceType: ec2.FlowLogResourceType.fromVpc(cxVpc),
        destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, vpcFlowLogRole),
        trafficType: FlowLogTrafficType.ALL,
    });

    return cxVpc;
}
