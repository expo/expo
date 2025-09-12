import { DevToolsPlugin } from '../DevToolsPlugin';
import { DevToolsPluginCliExtensionExecutor } from '../DevToolsPluginCliExtensionExecutor';

describe('DevToolsPluginExecutor', () => {
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
      const closeListeneres: (() => void)[] = [];
      let resolver: (() => void) | null = null;
      const closePromise = new Promise<void>((resolve) => (resolver = resolve));
      let log = '';
      let err = '';
      const mock = {
        spawn: jest.fn().mockReturnValue({
          on: (_evt, listener) => {
            closeListeneres.push(() => {
              listener(0);
              resolver();
            });
          },
          stdout: { on: (t) => (log += t) },
          stderr: { on: (t) => (err += t) },
        }),
      };
      jest.mock('child_process', () => mock);

      const executor = new DevToolsPluginCliExtensionExecutor(
        pluginDescriptor,
        PROJECT_ROOT,
        mock.spawn
      );

      const resultPromise = executor.execute({
        command: 'test-command',
        args: {},
        metroServerOrigin: 'http://localhost:8081',
      });
      closeListeneres.forEach((listener) => listener());
      await closePromise;
      const result = await resultPromise;

      expect(mock.spawn).toHaveBeenCalled();
      expect(result).toEqual([]);
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

const executePluginCommandAsync = async (pluginDescriptor: DevToolsPlugin) => {
  const closeListeneres: (() => void)[] = [];
  let resolver: (() => void) | null = null;
  const closePromise = new Promise<void>((resolve) => (resolver = resolve));
  let log = '';
  let err = '';
  const mock = {
    spawn: jest.fn().mockReturnValue({
      on: (_evt, listener) => {
        closeListeneres.push(() => {
          listener(0);
          resolver();
        });
      },
      stdout: { on: (t) => (log += t) },
      stderr: { on: (t) => (err += t) },
    }),
  };
  jest.mock('child_process', () => mock);

  const executor = new DevToolsPluginCliExtensionExecutor(
    pluginDescriptor,
    PROJECT_ROOT,
    mock.spawn
  );
  const resultPromise = executor.execute({
    command: 'test-command',
    args: {},
    metroServerOrigin: 'http://localhost:8081',
  });

  closeListeneres.forEach((listener) => listener());
  await closePromise;

  return await resultPromise;
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
