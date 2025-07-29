import { spawn } from 'child_process';
import path from 'path';

import { DevToolsPluginEndpoint } from './DevToolsPluginManager';

const DEFAULT_TIMEOUT_MS = 10_000; // 10 seconds

export interface DevToolsPluginCliCommandParameter {
  name: string;
  type: 'text' | 'number' | 'confirm';
  description?: string;
}

export interface DevToolsPluginCliCommand {
  name: string;
  title: string;
  environments: readonly ('cli' | 'mcp')[];
  parameters?: DevToolsPluginCliCommandParameter[];
}

export interface DevToolsPluginCliExecutorArguments {
  command: string;
  args?: Record<string, string | number | boolean>;
  metroServerOrigin: string;
}

export interface AutolinkingPlugin {
  packageName: string;
  packageRoot: string;
  webpageRoot?: string;
  cliExtensions?: {
    description: string;
    commands: DevToolsPluginCliCommand[];
    entryPoint: string;
  };
}

export class DevToolsPlugin {
  constructor(
    private plugin: AutolinkingPlugin,
    public readonly projectRoot: string,
    private spawnFunc: typeof spawn = spawn
  ) {}

  private _executor:
    | ((args: DevToolsPluginCliExecutorArguments) => Promise<string | undefined | null>)
    | undefined = undefined;

  get packageName(): string {
    return this.plugin.packageName;
  }

  get packageRoot(): string {
    return this.plugin.packageRoot;
  }

  get webpageEndpoint(): string | undefined {
    return this.plugin?.webpageRoot
      ? `${DevToolsPluginEndpoint}/${this.plugin?.packageName}`
      : undefined;
  }

  get webpageRoot(): string | undefined {
    return this.plugin?.webpageRoot;
  }

  get description(): string {
    return this.plugin.cliExtensions?.description ?? '';
  }

  get cliExtensions(): AutolinkingPlugin['cliExtensions'] {
    return this.plugin.cliExtensions;
  }

  get executor():
    | ((args: DevToolsPluginCliExecutorArguments) => Promise<string | undefined | null>)
    | undefined {
    if (this.plugin.cliExtensions?.entryPoint) {
      if (!this._executor) {
        this._executor = async ({
          command,
          args,
          metroServerOrigin,
        }: DevToolsPluginCliExecutorArguments) => {
          return new Promise<string>(async (resolve, reject) => {
            // Set up the command and its arguments
            const tool = path.join(this.plugin.packageRoot, this.plugin.cliExtensions!.entryPoint);
            const child = this.spawnFunc(
              'node',
              [tool, command, `'${JSON.stringify(args)}'`, `'${metroServerOrigin}'`],
              {
                cwd: this.projectRoot,
                shell: true,
                env: { ...process.env, FORCE_COLOR: '1' },
              }
            );
            let stdout = '';
            let stderr = '';
            let finished = false;

            // Collect output/error data
            child.stdout.on('data', (data) => (stdout += data.toString()));
            child.stderr.on('data', (data) => (stderr += data.toString()));

            // Setup timeout
            const timeoutMs = DEFAULT_TIMEOUT_MS;
            const timeout = setTimeout(() => {
              if (!finished) {
                finished = true;
                child.kill('SIGKILL');
                reject(new Error(`Command execution timed out after ${timeoutMs}ms`));
              }
            }, timeoutMs);

            child.on('close', (code: number) => {
              if (finished) return;
              finished = true;
              clearTimeout(timeout);
              if (code !== 0) {
                reject(stderr || `Process exited with code ${code}`);
              } else {
                resolve(stdout);
              }
            });

            child.on('error', (err: Error) => {
              if (finished) return;
              finished = true;
              clearTimeout(timeout);
              reject(err.message);
            });
          });
        };
      }
    }
    return this._executor;
  }
}
