import { PassThrough } from 'stream';

import { DevToolsPluginInfo } from '../DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from '../DevToolsPluginCliExtensionExecutor';

describe('DevToolsPluginCliExtensionExecutor', () => {
  it("should throw if the plugin doesn't have CLI extensions", () => {
    expect(() => new DevToolsPluginCliExtensionExecutor(PLUGIN_DESCRIPTOR, PROJECT_ROOT)).toThrow(
      /has no CLI extensions/
    );
  });

  describe('validation', () => {
    it('should validate that the command exists in the extension', async () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };
      const executor = new DevToolsPluginCliExtensionExecutor(pluginDescriptor, PROJECT_ROOT);
      await expect(() =>
        executor.validate({
          command: 'invalid-command',
          args: { foo: 'bar' },
        })
      ).toThrow();
    });

    it('should validate that parameter count for a command', async () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND_WITH_PARAMS],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };
      const executor = new DevToolsPluginCliExtensionExecutor(pluginDescriptor, PROJECT_ROOT);
      await expect(() =>
        executor.validate({
          command: 'test-command',
          args: {},
        })
      ).toThrow();
    });

    it('should validate that a parameter exists in the arguments provided for the command', async () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };
      const executor = new DevToolsPluginCliExtensionExecutor(pluginDescriptor, PROJECT_ROOT);
      await expect(() =>
        executor.validate({
          command: 'test-command',
          args: { invalidParam: 'value' },
        })
      ).toThrow();
    });
  });

  describe('execute', () => {
    it('should spawn a process when executing a command and wait for it to finish', async () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };
      const { close, spawn } = await executePluginCommandAsync({ pluginDescriptor });
      const result = await close(0);

      expect(spawn).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should fail gracefuly if the command times out', async () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };
      const { close, kill } = await executePluginCommandAsync({ pluginDescriptor, timeoutMs: 0 });
      await new Promise((resolve) => setTimeout(resolve, 50));
      const result = await close(0);

      expect(kill).toHaveBeenCalled();
      expect(result).toEqual([{ type: 'text', level: 'error', text: 'Command timed out' }]);
    });

    it('should handle arguments with characters that need escaping', async () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND_WITH_PARAMS],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };
      const args = { param1: `value'with"quotes' && || |##`, param2: 42 };
      const { close, spawn } = await executePluginCommandAsync({ pluginDescriptor, args });
      const result = await close(0);

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.stringContaining(JSON.stringify(args))]),
        expect.any(Object)
      );
      expect(result).toEqual([]);
    });

    it('should handle errors thrown by the command', async () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };

      const { close } = await executePluginCommandAsync({ pluginDescriptor });
      const result = await close(1);

      expect(result).toEqual([
        { type: 'text', level: 'error', text: 'Process exited with code 1' },
      ]);
    });
  });

  describe('getCommandString', () => {
    it('should return the command string for a command without parameters', () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };
      const executor = new DevToolsPluginCliExtensionExecutor(pluginDescriptor, PROJECT_ROOT);
      const commandString = executor.getCommandString({
        command: 'test-command',
        args: {},
      });
      expect(commandString).toBe(`node index.js test-command`);
    });

    it('should return the command string for a command with parameters', () => {
      const pluginDescriptor = {
        ...PLUGIN_DESCRIPTOR,
        cliExtensions: {
          commands: [COMMAND_WITH_PARAMS],
          description: 'Test Plugin',
          entryPoint: 'index.js',
        },
      };
      const executor = new DevToolsPluginCliExtensionExecutor(pluginDescriptor, PROJECT_ROOT);
      const commandString = executor.getCommandString({
        command: 'test-command',
        args: { param1: 'value1', param2: 42 },
      });
      expect(commandString).toBe(`node index.js test-command {"param1":"value1","param2":42}`);
    });
  });
});

// --------------- HELPERS  ---------------

const executePluginCommandAsync = async (params: {
  pluginDescriptor: DevToolsPluginInfo;
  args?: Record<string, any>;
  timeoutMs?: number;
  spawnFunc?: typeof import('child_process').spawn;
}) => {
  const { pluginDescriptor, args = {}, timeoutMs = 10_000, spawnFunc } = params;
  const closeListeneres: ((exitCode: number) => void)[] = [];
  let resolver: (() => void) | null = null;
  const closePromise = new Promise<void>((resolve) => (resolver = resolve));
  let log = '';
  let err = '';
  const kill = jest.fn();
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  stdout.on('data', (data) => (log += data.toString()));
  stderr.on('data', (data) => (err += data.toString()));
  const mock = {
    spawn:
      spawnFunc ??
      jest.fn().mockReturnValue({
        on: (_evt, listener) => {
          closeListeneres.push((exitCode: number) => {
            listener(exitCode);
            resolver();
          });
        },
        kill,
        stdout,
        stderr,
      }),
  };
  jest.doMock('child_process', () => mock);

  const executor = new DevToolsPluginCliExtensionExecutor(
    pluginDescriptor,
    PROJECT_ROOT,
    false,
    mock.spawn,
    timeoutMs
  );
  const resultPromise = executor.execute({
    command: 'test-command',
    args,
    metroServerOrigin: 'http://localhost:8081',
  });

  const close = async (exitCode: number) => {
    closeListeneres.forEach((listener) => listener(exitCode));
    await closePromise;

    return await resultPromise;
  };
  return { close, spawn: mock.spawn, kill };
};

// --------------- FIXTURES ---------------

const PROJECT_ROOT = '/path/to/project';
const PLUGIN_DESCRIPTOR = { packageName: 'test-plugin', packageRoot: '/path/to/test-plugin' };
const COMMAND = {
  name: 'test-command',
  title: 'Test Command',
  environments: ['cli'] as const,
  parameters: [],
};

const COMMAND_WITH_PARAMS = {
  name: 'test-command',
  title: 'Test Command',
  environments: ['cli'] as const,
  parameters: [
    {
      name: 'param1',
      type: 'text' as const,
      description: 'First parameter',
    },
    {
      name: 'param2',
      type: 'number' as const,
      description: 'Second parameter',
    },
  ],
};
