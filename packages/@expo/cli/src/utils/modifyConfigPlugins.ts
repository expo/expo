import { ExpoConfig, modifyConfigAsync } from '@expo/config';

import { warnAboutConfigAndThrow } from './modifyConfigAsync';
import * as Log from '../log';

export async function attemptAddingPluginsAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'plugins'>,
  plugins: string[]
): Promise<void> {
  if (!plugins.length) return;

  const edits = {
    plugins: [...new Set((exp.plugins || []).concat(plugins))],
  };
  const modification = await modifyConfigAsync(projectRoot, edits, {
    skipSDKVersionRequirement: true,
    skipPlugins: true,
  });
  if (modification.type === 'success') {
    Log.log(`\u203A Added config plugin${plugins.length === 1 ? '' : 's'}: ${plugins.join(', ')}`);
  } else {
    const exactEdits = {
      plugins,
    };
    warnAboutConfigAndThrow(modification.type, modification.message!, exactEdits);
  }
}
