import { validate } from '@expo/schema-utils';

import {
  type DevToolsPluginCommand,
  type DevToolsPluginCommandParameter,
  type DevToolsPluginInfo,
  type DevToolsPluginOutput,
  DevToolsPluginOutputSchema,
  PluginSchema,
} from '../DevToolsPlugin.schema';

const plugin = {
  packageName: 'test-plugin',
  packageRoot: '/plugins/test-plugin',
  webpageRoot: '/plugins/test-plugin/web',
  serverEntryPoint: 'server.js',
  bannerTitle: 'Test plugin',
  cliExtensions: {
    description: 'Test commands',
    entryPoint: 'cli.js',
    commands: [
      {
        name: 'configure',
        title: 'Configure',
        environments: ['cli', 'mcp'],
        parameters: [
          { name: 'name', type: 'text', description: 'A name' },
          { name: 'count', type: 'number' },
          { name: 'enabled', type: 'confirm' },
        ],
      },
    ],
  },
} satisfies DevToolsPluginInfo;

describe('PluginSchema', () => {
  it.each([
    { packageName: 'minimal-plugin', packageRoot: '/plugins/minimal-plugin' },
    plugin,
    { ...plugin, bannerTitle: true },
    { ...plugin, bannerTitle: false },
    {
      ...plugin,
      cliExtensions: {
        ...plugin.cliExtensions,
        commands: [{ name: 'list', title: 'List', environments: [] }],
      },
    },
  ] satisfies DevToolsPluginInfo[])('accepts the typed plugin %j', (value) => {
    expect(() => validate(PluginSchema, value)).not.toThrow();
  });

  it.each([
    // @ts-expect-error packageRoot is required.
    { packageName: 'test-plugin' } satisfies DevToolsPluginInfo,
    // @ts-expect-error packageName must be a string.
    { ...plugin, packageName: 123 } satisfies DevToolsPluginInfo,
    // @ts-expect-error bannerTitle must be a string or boolean.
    { ...plugin, bannerTitle: 123 } satisfies DevToolsPluginInfo,
    // @ts-expect-error cliExtensions must include commands and entryPoint.
    { ...plugin, cliExtensions: { description: 'Incomplete' } } satisfies DevToolsPluginInfo,
  ])('rejects the type-invalid plugin %j', (value) => {
    expect(() => validate(PluginSchema, value)).toThrow();
  });

  it.each([
    // @ts-expect-error commands require environments.
    { name: 'list', title: 'List' } satisfies DevToolsPluginCommand,
    // @ts-expect-error web is not a supported environment.
    { name: 'list', title: 'List', environments: ['web'] } satisfies DevToolsPluginCommand,
  ])('rejects the type-invalid command %j', (value) => {
    expect(() =>
      validate(PluginSchema, {
        ...plugin,
        cliExtensions: { ...plugin.cliExtensions, commands: [value] },
      })
    ).toThrow();
  });

  it.each([
    // @ts-expect-error parameters require a name.
    { type: 'text' } satisfies DevToolsPluginCommandParameter,
    // @ts-expect-error date is not a supported parameter type.
    { name: 'value', type: 'date' } satisfies DevToolsPluginCommandParameter,
    // @ts-expect-error descriptions must be strings.
    { name: 'value', type: 'text', description: 123 } satisfies DevToolsPluginCommandParameter,
  ])('rejects the type-invalid parameter %j', (value) => {
    expect(() =>
      validate(PluginSchema, {
        ...plugin,
        cliExtensions: {
          ...plugin.cliExtensions,
          commands: [{ ...plugin.cliExtensions.commands[0], parameters: [value] }],
        },
      })
    ).toThrow();
  });

  it.each([
    { ...plugin, packageName: '' },
    { ...plugin, packageRoot: '' },
    { ...plugin, bannerTitle: '' },
    { ...plugin, cliExtensions: { ...plugin.cliExtensions, commands: [] } },
    { ...plugin, cliExtensions: { ...plugin.cliExtensions, entryPoint: '' } },
  ] satisfies DevToolsPluginInfo[])(
    'rejects values outside the runtime constraints %j',
    (value) => {
      expect(() => validate(PluginSchema, value)).toThrow();
    }
  );
});

describe('DevToolsPluginOutputSchema', () => {
  it.each(
    (
      [
        [],
        [{ type: 'text', text: 'Hello', level: 'info' }],
        [{ type: 'text', text: '', level: 'warning', url: 'relative/path' }],
        [{ type: 'text', text: 'Failed', level: 'error' }],
        [{ type: 'image', url: 'file:///tmp/image.png', text: 'Screenshot' }],
        [{ type: 'audio', url: 'data:audio/wav;base64,AAAA' }],
      ] satisfies DevToolsPluginOutput[]
    ).map((value) => ({ value }))
  )('accepts the typed output $value', ({ value }) => {
    expect(() => validate(DevToolsPluginOutputSchema, value)).not.toThrow();
  });

  it.each(
    [
      // @ts-expect-error text output requires a level.
      [{ type: 'text', text: 'Hello' }] satisfies DevToolsPluginOutput,
      // @ts-expect-error image output requires a URL.
      [{ type: 'image', text: 'Screenshot' }] satisfies DevToolsPluginOutput,
      // @ts-expect-error debug is not a supported output level.
      [{ type: 'text', text: 'Hello', level: 'debug' }] satisfies DevToolsPluginOutput,
      // @ts-expect-error video is not a supported output type.
      [{ type: 'video', url: 'https://expo.dev/video.mp4' }] satisfies DevToolsPluginOutput,
    ].map((value) => ({ value }))
  )('rejects the type-invalid output $value', ({ value }) => {
    expect(() => validate(DevToolsPluginOutputSchema, value)).toThrow();
  });

  it.each(
    (
      [
        [{ type: 'image', url: 'https://' }],
        [{ type: 'audio', url: 'relative/path' }],
      ] satisfies DevToolsPluginOutput[]
    ).map((value) => ({ value }))
  )('rejects invalid resource URLs $value', ({ value }) => {
    expect(() => validate(DevToolsPluginOutputSchema, value)).toThrow();
  });
});
