import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getSdkCompat } from '../sdkCompat';

const SNIPPETS_DIR = path.resolve(__dirname, '../../../expo-module-template/snippets');

describe(getSdkCompat, () => {
  it('reads the SDK 55 overrides shipped with the template package', () => {
    expect(getSdkCompat(SNIPPETS_DIR, 55)).toEqual({
      iosDeploymentTarget: '15.1',
      composeVersions: { foundation: '1.10.2', ui: '1.10.2', material3: '1.5.0-alpha13' },
      modernExpoUI: false,
    });
  });

  it('returns no overrides for the SDK the template is written for', () => {
    expect(getSdkCompat(SNIPPETS_DIR, 58)).toEqual({});
  });

  it('returns no overrides when the SDK is unknown', () => {
    expect(getSdkCompat(SNIPPETS_DIR, null)).toEqual({});
  });

  it('returns no overrides for a template package without a compat table', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'no-compat-'));
    try {
      expect(getSdkCompat(dir, 55)).toEqual({});
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  });
});
