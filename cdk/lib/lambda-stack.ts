import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { spawnSync } from 'child_process';
import { IBuildProvider, ProviderBuildOptions, TypeScriptCode } from '@mrgrain/cdk-esbuild';
import { Construct } from 'constructs';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';

class BuildScriptProvider implements IBuildProvider {
    constructor(public readonly scriptPath: string) {}

    buildSync(options: ProviderBuildOptions): void {
        const result = spawnSync('node', [this.scriptPath, JSON.stringify(options)], {
            stdio: ['inherit', 'inherit', 'pipe'],
        });

        if (result.stderr.byteLength > 0) {
            throw result.stderr.toString();
        }
    }
}

export interface LambdaStackFunctions {
    helloLambdaFn: lambda.Function;
}

export class LambdaStack extends Stack {
    private lambdaConfig: lambda.FunctionProps;
    private commonLambdaRole: iam.Role;

    private helloLambdaFn: lambda.Function;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.commonLambdaRole = this.setupCommonLambdaRole();
        this.lambdaConfig = this.setupLambdaConfig();

        this.helloLambdaFn = this.setupHelloLambda();
    }

    private setupHelloLambda(): lambda.Function {
        return new lambda.Function(this, 'HelloLambdaFn', {
            ...this.lambdaConfig,
            handler: 'handler.helloHandler',
        });
    }

    private setupCommonLambdaRole(): iam.Role {
        const commonLambdaRole = new iam.Role(this, 'LambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });
        commonLambdaRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        );
        commonLambdaRole.attachInlinePolicy(
            new iam.Policy(this, 'LambdaPolicy', {
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: ['lambda:InvokeFunction'],
                        resources: ['*'],
                    }),
                ],
            }),
        );
        return commonLambdaRole;
    }

    private setupLambdaConfig(): lambda.FunctionProps {
        const code: TypeScriptCode | lambda.Code = this.setupEsbuild();
        return {
            handler: '', // handler is set in setupEsbuild()
            code,
            memorySize: 1024,
            timeout: Duration.seconds(120),
            runtime: lambda.Runtime.NODEJS_18_X,
            architecture: lambda.Architecture.X86_64,
            logRetention: 30,
            environment: {
                NODE_OPTIONS: '--enable-source-maps',
                IS_OFFLINE: process.env.IS_OFFLINE ?? '',
                LOG_LEVEL: process.env.STAGE != 'prod' ? 'DEBUG' : 'INFO',
                HOST_DOCKER_INTERNAL: '',
            },
            // bundling: {
            //   sourceMap: true,
            //   nodeModules: ['knex'] // to force install after esnode bundle
            // },
            role: this.commonLambdaRole,
            currentVersionOptions: {
                removalPolicy: RemovalPolicy.RETAIN, // retain old versions
            },
            description: `Generated on: ${new Date().toISOString()}`,
        };
    }

    private setupEsbuild(): TypeScriptCode | lambda.Code {
        if (process.env.IS_OFFLINE === 'true') {
            const buildProvider = new BuildScriptProvider('./lib/build.mjs');
            buildProvider.buildSync({
                platform: 'node',
                entryPoints: ['./handler.ts'],
                outdir: './dist',
            });
            return lambda.Code.fromAsset('./dist');
        }

        return new TypeScriptCode('./handler.ts', {
            buildProvider: new BuildScriptProvider('./lib/build.mjs'),
        });
    }

    public get functions(): LambdaStackFunctions {
        return {
            helloLambdaFn: this.helloLambdaFn,
        } as LambdaStackFunctions;
    }
}
