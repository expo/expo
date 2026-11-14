import type { ExportedConfig } from 'expo/config-plugins';

import withExpoVideo, { type WithExpoVideoOptions } from '../withExpoVideo';

async function evalInfoPlistModAsync(
  options: WithExpoVideoOptions,
  modResults: Record<string, any>
): Promise<Record<string, any>> {
  const config: ExportedConfig = withExpoVideo({ name: 'test', slug: 'test' }, options);
  const mod = config.mods?.ios?.infoPlist;
  if (!mod) {
    throw new Error('Expected the mod to be registered');
  }
  const result = await mod({
    ...config,
    modResults,
    modRequest: {
      projectRoot: '/app',
      platformProjectRoot: '/app/ios',
      modName: 'test',
      platform: 'ios',
      introspect: true,
    },
    modRawConfig: config,
  });
  return result.modResults;
}

describe(withExpoVideo, () => {
  it('keeps the audio background mode added by another plugin when both options are false', async () => {
    const infoPlist = await evalInfoPlistModAsync(
      { supportsBackgroundPlayback: false, supportsPictureInPicture: false },
      { UIBackgroundModes: ['audio'] }
    );
    expect(infoPlist.UIBackgroundModes).toEqual(['audio']);
  });
});
