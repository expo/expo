// What `introspectConfigAsync` makes of a run that failed: the reason it quotes back has to be the
// sentence the tool wrote, not the frames underneath it.
import { spawnSubprocessAsync } from '../../utils/subprocess';
import { introspectConfigAsync } from '../introspectAsync';

jest.mock('../../utils/subprocess', () => ({ spawnSubprocessAsync: jest.fn() }));
jest.mock('../../utils/expoCli', () => ({
  resolveExpoCli: () => ({ command: 'expo', args: ['config'] }),
}));

const spawn = spawnSubprocessAsync as jest.MockedFunction<typeof spawnSubprocessAsync>;
const projectRoot = '/project';

function answers(output: { stdout?: string; stderr?: string; exitCode: number | null }): void {
  spawn.mockResolvedValue({ stdout: '', stderr: '', ...output });
}

// F133 [live, wave 31]: a broken plugin entry is reported by `@expo/config-plugins` as one
// sentence followed by ten stack frames, and the tail of that stream is ten stack frames. So
// `inspect:config-plugins` answered a config with `./plugins/withNothingHere` in it with a `Why:`
// line that was pure `at resolvePluginForModule (...)` — naming no plugin, no file and no cause,
// while the CLI on the other side of the spawn had said all three on its first line
// [`wave31-open-cells/evidence/62-inspect-plugins-broken.out`].
describe('introspectConfigAsync', () => {
  const pluginError =
    'PluginError: Failed to resolve plugin for module "./plugins/withNothingHere" relative to "/project". Do you have node modules installed?';
  const frames = [
    '    at resolvePluginForModule (/project/node_modules/@expo/config-plugins/build/utils/plugin-resolver.js:84:9)',
    '    at resolveConfigPluginFunctionWithInfo (/project/node_modules/@expo/config-plugins/build/utils/plugin-resolver.js:133:7)',
    '    at withStaticPlugin (/project/node_modules/@expo/config-plugins/build/plugins/withStaticPlugin.js:83:70)',
    '    at Array.reduce (<anonymous>)',
    '    at withPlugins (/project/node_modules/@expo/config-plugins/build/plugins/withPlugins.js:28:18)',
    '    at withConfigPlugins (/project/node_modules/@expo/config/build/plugins/withConfigPlugins.js:33:47)',
    '    at fillAndReturnConfig (/project/node_modules/@expo/config/build/Config.js:247:78)',
    '    at getConfig (/project/node_modules/@expo/config/build/Config.js:304:10)',
    '    at getPrebuildConfigAsync (/project/node_modules/@expo/prebuild-config/build/getPrebuildConfig.js:31:39)',
    '    at configAsync (/project/node_modules/@expo/cli/build/src/config/configAsync.js:52:24)',
    '    at async /project/node_modules/@expo/cli/build/src/config/index.js:41:9',
  ];

  it(`should quote the reason the CLI gave rather than the frames under it`, async () => {
    // The CLI prints the message, then the same message again with its stack, which is what a
    // thrown Node error looks like on a stream.
    answers({
      exitCode: 1,
      stderr: [pluginError, pluginError, ...frames].join('\n') + '\n',
    });

    await expect(introspectConfigAsync(projectRoot)).rejects.toMatchObject({
      code: 'CONFIG_INTROSPECT_FAILED',
    });

    const error = await introspectConfigAsync(projectRoot).catch((thrown) => thrown);
    expect(error.message).toContain('Failed to resolve plugin for module');
    expect(error.message).toContain('./plugins/withNothingHere');
    // The frames are the diagnostic detail, not the reason, so they are not what `Why:` reads as.
    expect(error.message).not.toContain('at resolvePluginForModule');
    expect(error.message).toContain('expo config exited with code 1');
    // Said once. The CLI wrote it twice — as the message, then as its stack's header — and with the
    // frames gone that is the same sentence on two consecutive lines.
    expect(error.message.split('Failed to resolve plugin for module')).toHaveLength(2);
  });

  it(`should fall back to the tail when the tool wrote nothing but frames`, async () => {
    answers({ exitCode: 1, stderr: frames.join('\n') + '\n' });

    const error = await introspectConfigAsync(projectRoot).catch((thrown) => thrown);
    // Nothing was said, so the frames are all there is — better than the sentence about a CLI that
    // "stopped without a message", which would be untrue here.
    expect(error.message).toContain('at configAsync');
  });

  it(`should say so when the tool wrote nothing at all`, async () => {
    answers({ exitCode: 1 });

    const error = await introspectConfigAsync(projectRoot).catch((thrown) => thrown);
    expect(error.message).toContain('the CLI stopped without a message');
  });
});
