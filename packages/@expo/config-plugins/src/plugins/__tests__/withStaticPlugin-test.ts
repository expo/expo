import { withPlugins } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { join } from 'path';

import { withStaticPlugin } from '../withStaticPlugin';

function withInternal(config: ExpoConfig, projectRoot: string) {
  if (!config._internal) config._internal = {};
  config._internal.projectRoot = projectRoot;
  return config;
}

function withInternalRemoved(config: ExpoConfig) {
  delete config._internal;
  return config;
}

jest.unmock('resolve-from');

const projectRoot = join(__dirname, 'fixtures/project-files');

// Not using in-memory fs because the node resolution isn't mocked out.
describe(withStaticPlugin, () => {
  it(`asserts wrong type`, () => {
    const config = withInternal(
      {
        name: 'foo',
        slug: 'foo',
      },
      '/'
    );

    expect(() =>
      withStaticPlugin(config, {
        // @ts-ignore -- invalid type
        plugin: true,
      })
    ).toThrow('Plugin is an unexpected type: boolean');
    expect(() =>
      withStaticPlugin(config, {
        // @ts-ignore -- invalid type
        plugin: [true],
      })
    ).toThrow('Plugin is an unexpected type: boolean');
    expect(() =>
      withStaticPlugin(config, {
        // @ts-ignore -- invalid type
        plugin: {},
      })
    ).toThrow('Plugin is an unexpected type: object');
  });
  it(`asserts wrong number of arguments`, () => {
    const config = withInternal(
      {
        name: 'foo',
        slug: 'foo',
      },
      '/'
    );

    expect(() =>
      withStaticPlugin(config, {
        // @ts-ignore -- invalid type
        plugin: ['', '', ''],
      })
    ).toThrow(
      'Wrong number of arguments provided for static config plugin, expected either 1 or 2, got 3'
    );
  });
  it(`uses internal projectRoot`, () => {
    let config: ExpoConfig = withInternal(
      {
        name: 'foo',
        slug: 'foo',
      },
      projectRoot
    );

    config = withPlugins(config, [
      // @ts-ignore -- invalid type
      c =>
        withStaticPlugin(c, {
          plugin: './my-plugin.js',
        }),
      // @ts-ignore -- invalid type
      withInternalRemoved,
    ]);

    expect(config).toStrictEqual({
      name: 'foo',
      slug: 'foo',
      extras: {
        modified: true,
      },
    });
  });

  it(`passes props to plugin`, () => {
    let config: ExpoConfig = withInternal(
      {
        name: 'foo',
        slug: 'foo',
      },
      '.'
    );

    config = withPlugins(config, [
      // @ts-ignore -- invalid type
      c =>
        withStaticPlugin(c, {
          plugin: ['./my-plugin.js', { foobar: true }],
          projectRoot,
        }),
      // Uses a folder with index.js
      // @ts-ignore -- invalid type
      c =>
        withStaticPlugin(c, {
          plugin: './beta',
          projectRoot,
        }),
    ]);

    expect(config).toStrictEqual({
      name: 'foo',
      slug: 'foo',
      extras: {
        beta: true,
        modified: true,
        foobar: true,
      },
      _internal: {
        projectRoot: '.',
      },
    });
  });

  it(`fails to resolve a non-existent file`, () => {
    const config = {
      name: 'foo',
      slug: 'foo',
    };

    expect(() =>
      withStaticPlugin(config, {
        plugin: ['./not-existing.js', { foobar: true }],
        projectRoot,
      })
    ).toThrow(/Failed to resolve plugin for module ".\/not-existing.js"/);
  });
});
