import { ConfigPlugin } from '../../Plugin.types';
import { withPlugins } from '../withPlugins';
import { createRunOncePlugin, withRunOnce } from '../withRunOnce';

describe(withRunOnce, () => {
  it('runs plugins multiple times without withRunOnce', () => {
    const pluginA: ConfigPlugin = jest.fn(config => config);

    withPlugins({ extra: [], _internal: { projectRoot: '.' } } as any, [
      // Prove unsafe runs as many times as it was added
      pluginA,
      pluginA,
    ]);

    // Unsafe runs multiple times
    expect(pluginA).toBeCalledTimes(2);
  });

  it('prevents running different plugins with same id', () => {
    const pluginA: ConfigPlugin = jest.fn(config => config);
    const pluginB: ConfigPlugin = jest.fn(config => config);

    const pluginId = 'foo';

    const safePluginA = createRunOncePlugin(pluginA, pluginId);
    // A different plugin with the same ID as (A), this proves
    // that different plugins can be prevented when using the same ID.
    const safePluginB = createRunOncePlugin(pluginB, pluginId);

    withPlugins({ extra: [], _internal: { projectRoot: '.' } } as any, [
      // Run plugin twice
      safePluginA,
      safePluginB,
    ]);

    // Prove that each plugin is only run once
    expect(pluginA).toBeCalledTimes(1);
    expect(pluginB).toBeCalledTimes(0);
  });

  it('prevents running the same plugin twice', () => {
    const pluginA: ConfigPlugin = jest.fn(config => config);
    const pluginId = 'foo';

    const safePluginA = createRunOncePlugin(pluginA, pluginId);

    withPlugins({ extra: [], _internal: { projectRoot: '.' } } as any, [
      // Run plugin twice
      safePluginA,
      safePluginA,
    ]);

    // Prove that each plugin is only run once
    expect(pluginA).toBeCalledTimes(1);
  });
});
