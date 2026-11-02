import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { addMissingAppConfigFields } from '../createExampleApp';
import type { SubstitutionData } from '../types';

describe(addMissingAppConfigFields, () => {
  let appPath: string;

  beforeEach(() => {
    appPath = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-module-example-'));
    fs.writeFileSync(
      path.join(appPath, 'app.json'),
      JSON.stringify({ expo: { name: 'example', experiments: { typedRoutes: true } } })
    );
  });

  afterEach(() => {
    fs.rmSync(appPath, { recursive: true, force: true });
  });

  it('sets the app IDs and makes Metro use the autolinked react-native', async () => {
    const data = { project: { package: 'expo.modules.mymodule' } } as SubstitutionData;
    await addMissingAppConfigFields(appPath, data);

    const { expo } = JSON.parse(fs.readFileSync(path.join(appPath, 'app.json'), 'utf8'));
    expect(expo.ios.bundleIdentifier).toBe('expo.modules.mymodule.example');
    expect(expo.android.package).toBe('expo.modules.mymodule.example');
    expect(expo.experiments).toEqual({ typedRoutes: true, autolinkingModuleResolution: true });
  });
});
