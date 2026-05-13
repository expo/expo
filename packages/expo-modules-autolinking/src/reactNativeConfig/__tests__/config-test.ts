import { vol } from 'memfs';
import path from 'path';

import { createMemoizer, _verifyMemoizerFreed } from '../../memoize';
import { loadConfigAsync } from '../config';

jest.mock('fs/promises');

const EXPO_MONOREPO_ROOT = path.resolve(__dirname, '../../../../..');

const itWithMemoize = (name: string, fn: () => Promise<void>) => {
  return it(name, async () => {
    await createMemoizer().withMemoizer(fn);
    expect(_verifyMemoizerFreed()).toBe(true);
  });
};

describe('loadConfigAsync', () => {
  afterEach(() => {
    vol.reset();
  });

  itWithMemoize('should load react-native.config.js', async () => {
    await jest.isolateModulesAsync(async () => {
      vol.fromJSON({
        '/app/react-native.config.js': 'module.exports = { version: "1.0.0" };',
      });
      const result = await loadConfigAsync('/app');
      expect(result).toEqual({ version: '1.0.0' });
    });
  });

  itWithMemoize('should load react-native.config.ts', async () => {
    await jest.isolateModulesAsync(async () => {
      vol.fromJSON({
        '/app/react-native.config.ts': 'export default { version: "1.0.0" };',
      });
      const result = await loadConfigAsync('/app');
      expect(result).toEqual({ version: '1.0.0' });
    });
  });

  itWithMemoize('should load react-native.config.ts with cjs exports', async () => {
    await jest.isolateModulesAsync(async () => {
      vol.fromJSON({
        '/app/react-native.config.ts': 'module.exports = { version: "1.0.0" };',
      });
      const result = await loadConfigAsync('/app');
      expect(result).toEqual({ version: '1.0.0' });
    });
  });
});
