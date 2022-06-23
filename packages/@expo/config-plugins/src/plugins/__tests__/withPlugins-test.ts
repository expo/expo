import { ConfigPlugin } from '../../Plugin.types';
import { withPlugins } from '../withPlugins';

describe(withPlugins, () => {
  it('compiles plugins in the correct order', () => {
    const pluginA: ConfigPlugin = config => {
      config.extra.push('alpha');
      return config;
    };
    const pluginB: ConfigPlugin<string> = (config, props = 'charlie') => {
      config.extra.push('beta', props);
      return config;
    };

    expect(
      withPlugins({ extra: [], _internal: { projectRoot: '.' } } as any, [
        // Standard plugin
        pluginA,
        // Plugin with no properties
        // @ts-ignore: users shouldn't do this.
        [pluginB],
        // Plugin with properties
        [pluginB, 'delta'],
      ])
    ).toStrictEqual({
      _internal: {
        projectRoot: '.',
      },
      extra: ['alpha', 'beta', 'charlie', 'beta', 'delta'],
    });
  });
});
