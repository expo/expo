import { AndroidConfig, AndroidManifest, XML } from '@expo/config-plugins';

import rnFixture from '../../../__tests__/fixtures/react-native-project';
import { getBranchApiKey, setBranchApiKey } from '../withAndroidBranch';

const { findMetaDataItem, getMainApplication } = AndroidConfig.Manifest;

async function getFixtureManifestAsync() {
  return (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;
}

describe('Android branch test', () => {
  it(`returns null if no android branch api key is provided`, () => {
    expect(getBranchApiKey({ android: { config: {} } } as any)).toBe(null);
  });

  it(`returns apikey if android branch api key is provided`, () => {
    expect(
      getBranchApiKey({ android: { config: { branch: { apiKey: 'MY-API-KEY' } } } } as any)
    ).toBe('MY-API-KEY');
  });

  it('sets branch api key in AndroidManifest.xml if given', async () => {
    let androidManifestJson = await getFixtureManifestAsync();
    androidManifestJson = await setBranchApiKey(
      { android: { config: { branch: { apiKey: 'MY-API-KEY' } } } } as any,
      androidManifestJson
    );
    let mainApplication = getMainApplication(androidManifestJson);

    expect(findMetaDataItem(mainApplication, 'io.branch.sdk.BranchKey')).toBeGreaterThan(-1);

    // Unset the item

    androidManifestJson = await setBranchApiKey(
      { android: { config: { branch: { apiKey: null } } } } as any,
      androidManifestJson
    );
    mainApplication = getMainApplication(androidManifestJson);

    expect(findMetaDataItem(mainApplication, 'io.branch.sdk.BranchKey')).toBe(-1);
  });
});
