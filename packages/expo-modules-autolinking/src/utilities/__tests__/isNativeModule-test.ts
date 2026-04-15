import { vol } from 'memfs';

import { createMemoizer, _verifyMemoizerFreed } from '../../memoize';
import { isNativeModuleAsync } from '../isNativeModule';

const modulePath = '/fake/project/node_modules/my-module';

const itWithMemoize = (name: string, fn: () => Promise<void>) => {
  return it(name, async () => {
    await createMemoizer().withMemoizer(fn);
    expect(_verifyMemoizerFreed()).toBe(true);
  });
};

describe(isNativeModuleAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  itWithMemoize('returns true for a module with expo-module.config.json', async () => {
    vol.fromNestedJSON(
      {
        'package.json': JSON.stringify({ name: 'my-module', version: '1.0.0' }),
        'expo-module.config.json': JSON.stringify({ platforms: ['android', 'ios'] }),
      },
      modulePath
    );

    expect(await isNativeModuleAsync(modulePath)).toBe(true);
  });

  itWithMemoize('returns false for a plain JS module', async () => {
    vol.fromNestedJSON(
      {
        'package.json': JSON.stringify({ name: 'my-module', version: '1.0.0' }),
        'index.js': 'module.exports = {}',
      },
      modulePath
    );

    expect(await isNativeModuleAsync(modulePath)).toBe(false);
  });
});
