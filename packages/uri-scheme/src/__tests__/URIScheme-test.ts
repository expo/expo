import { join } from 'path';

import * as Android from '../Android';
import * as Ios from '../Ios';
import * as URIScheme from '../URIScheme';

const projectRoot = join(__dirname, 'fixtures/react-native');

it(`cannot add a duplicate uri`, async () => {
  const platforms = await URIScheme.addAsync({
    projectRoot,
    uri: 'demo.app',
  });
  expect(platforms.length).toBe(0);
});

it(`cannot remove an invalid uri`, async () => {
  const platforms = await URIScheme.removeAsync({
    projectRoot,
    uri: 'invalid.value',
  });
  expect(platforms.length).toBe(0);
});

it(`gets available platforms with default settings`, async () => {
  const platforms = await URIScheme.getAvailablePlatforms({
    projectRoot,
  });
  expect(platforms).toContain('ios');
  expect(platforms).toContain('android');
});

it(`lists schemes`, async () => {
  await URIScheme.listAsync({
    projectRoot,
    infoPath: Ios.getConfigPath(projectRoot),
    manifestPath: Android.getConfigPath(projectRoot),
  });
});
