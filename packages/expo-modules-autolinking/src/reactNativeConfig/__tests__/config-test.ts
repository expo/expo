import { vol } from 'memfs';
import path from 'path';

import { loadConfigAsync } from '../config';

jest.mock('fs/promises');

const EXPO_MONOREPO_ROOT = path.resolve(__dirname, '../../../../..');

describe(loadConfigAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should load react-native.config.js', async () => {
    await jest.isolateModulesAsync(async () => {
      vol.fromJSON({
        '/app/react-native.config.js': 'module.exports = { version: "1.0.0" };',
      });
      const result = await loadConfigAsync('/app');
      expect(result).toEqual({ version: '1.0.0' });
    });
  });

  it('should load react-native.config.ts', async () => {
    await jest.isolateModulesAsync(async () => {
      vol.fromJSON({
        '/app/react-native.config.ts': 'export default { version: "1.0.0" };',
      });
      const result = await loadConfigAsync('/app');
      expect(result).toEqual({ version: '1.0.0' });
    });
  });

  it('should load react-native.config.ts with cjs exports', async () => {
    await jest.isolateModulesAsync(async () => {
      vol.fromJSON({
        '/app/react-native.config.ts': 'module.exports = { version: "1.0.0" };',
      });
      const result = await loadConfigAsync('/app');
      expect(result).toEqual({ version: '1.0.0' });
    });
  });
});
