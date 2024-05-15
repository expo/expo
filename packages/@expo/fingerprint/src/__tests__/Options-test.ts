import { vol } from 'memfs';
import requireString from 'require-from-string';

import { normalizeOptionsAsync } from '../Options';

jest.mock('fs/promises');
// Mock cpus to return a single core for consistent snapshot testing
jest.mock('os', () => ({ cpus: jest.fn().mockReturnValue([0]) }));

describe(normalizeOptionsAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return the default options if no options are provided', async () => {
    const options = await normalizeOptionsAsync('/app');
    expect(options).toMatchSnapshot();
  });

  it('should respect fingerprint config', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
/** @type {import('@expo/fingerprint').Config} */
const config = {
  hashAlgorithm: 'sha256',
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock('/app/fingerprint.config.js', () => requireString(configContents), {
        virtual: true,
      });

      const { hashAlgorithm } = await normalizeOptionsAsync('/app');
      expect(hashAlgorithm).toBe('sha256');
    });
  });

  it('should respect explicit option from arguments than fingerprint config', async () => {
    await jest.isolateModulesAsync(async () => {
      const configContents = `\
/** @type {import('@expo/fingerprint').Config} */
const config = {
  hashAlgorithm: 'sha256',
};
module.exports = config;
`;
      vol.fromJSON({ '/app/fingerprint.config.js': configContents });
      jest.doMock('/app/fingerprint.config.js', () => requireString(configContents), {
        virtual: true,
      });

      const { hashAlgorithm } = await normalizeOptionsAsync('/app', { hashAlgorithm: 'md5' });
      expect(hashAlgorithm).toBe('md5');
    });
  });
});
