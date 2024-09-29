import { AutoScalingGroup, AutoScalingGroupProps } from 'aws-cdk-lib/aws-autoscaling';
import { ISecurityGroup, IVpc, Port, SecurityGroup, UserData } from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class Ec2AutoScalingGroup extends AutoScalingGroup {
    constructor(scope: Construct, id: string, props: AutoScalingGroupProps) {
        super(scope, id, {
            minCapacity: 1,
            maxCapacity: 2,
            ...props,
        });
    }

    public static getSecurityGroup(scope: Construct, vpc: IVpc): ISecurityGroup {
        return new SecurityGroup(scope, 'Ec2InstanceSG', {
            vpc,
            allowAllOutbound: true,
            description: 'Allow traffic',
        });
    }

    public static addAlbIngressRule(securityGroup: ISecurityGroup, albSecurityGroup: ISecurityGroup) {
        securityGroup.addIngressRule(albSecurityGroup, Port.tcp(80), 'Allow HTTP traffic');
        securityGroup.addIngressRule(albSecurityGroup, Port.tcp(443), 'Allow HTTPS traffic');
        return securityGroup;
    }

    public static getEc2UserData(): UserData {
        const userData = UserData.forLinux();
        userData.addCommands(
            `yum install -y amazon-linux-extras`,
            `sudo yum update -y`,
            `sudo yum install -y httpd`,
            `sudo systemctl start httpd`,
            `sudo systemctl enable httpd`,
            `echo "Hello from your custom AMI" > /var/www/html/index.html`,
        );
        return userData;
    }

    public static getEc2Role(scope: Construct): Role {
        const role = new Role(scope, 'Ec2InstanceRole', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
        });
        role.addManagedPolicy({
            managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        });
        return role;
    }
}
