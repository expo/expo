import { modifyConfigAsync } from '@expo/config';

import { warnAboutConfigAndThrow } from './modifyConfigAsync';
import * as Log from '../log';

export async function attemptAddingPluginsAsync(
  projectRoot: string,
  plugins: string[]
): Promise<void> {
  if (!plugins.length) return;

  const modification = await modifyConfigAsync(
    projectRoot,
    { plugins },
    {
      skipSDKVersionRequirement: true,
      skipPlugins: true,
    }
  );
  if (modification.type === 'success') {
    Log.log(`\u203A Added config plugin${plugins.length === 1 ? '' : 's'}: ${plugins.join(', ')}`);
  } else {
    const exactEdits = {
      plugins,
    };
    warnAboutConfigAndThrow(modification.type, modification.message!, exactEdits);
  }
}
