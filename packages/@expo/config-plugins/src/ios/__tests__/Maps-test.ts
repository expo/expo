import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import {
  addGoogleMapsAppDelegateImport,
  addGoogleMapsAppDelegateInit,
  addMapsCocoaPods,
  getGoogleMapsApiKey,
  MATCH_INIT,
  removeGoogleMapsAppDelegateImport,
  removeGoogleMapsAppDelegateInit,
  removeMapsCocoaPods,
  setGoogleMapsApiKey,
} from '../Maps';
import {
  ExpoModulesAppDelegate,
  ExpoReactAppDelegate,
  UnimodulesAppDelegate,
} from './fixtures/AppDelegate';
import { PodfileBasic } from './fixtures/Podfile';

describe('MATCH_INIT', () => {
  it(`matches unimodules projects`, () => {
    expect(
      `self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];`
    ).toMatch(MATCH_INIT);
    // wrapped
    expect(`self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]`).toMatch(MATCH_INIT);
    // short hand
    expect(`_moduleRegistryAdapter=[[UMModuleRegistryAdapter alloc]`).toMatch(MATCH_INIT);
    // any name
    expect(`_mo=[[UMModuleRegistryAdapter alloc]`).toMatch(MATCH_INIT);
  });
  it(`matches RN projects`, () => {
    expect(
      `RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];`
    ).toMatch(MATCH_INIT);
    // wrapped
    expect(`RCTBridge*bri=[[RCTBridge alloc]`).toMatch(MATCH_INIT);
  });
  it(`matches React AppDelegate`, () => {
    expect(
      `RCTBridge *bridge = [self.reactDelegate createBridgeWithDelegate:self launchOptions:launchOptions];`
    ).toMatch(MATCH_INIT);
  });
});

describe(getGoogleMapsApiKey, () => {
  it(`returns null from all getters if no value provided`, () => {
    expect(getGoogleMapsApiKey({})).toBe(null);
  });

  it(`returns the correct values from all getters if a value is provided`, () => {
    expect(getGoogleMapsApiKey({ ios: { config: { googleMapsApiKey: '123' } } })).toBe('123');
  });
});
describe(getGoogleMapsApiKey, () => {
  it(`sets the google maps api key if provided or returns plist`, () => {
    expect(setGoogleMapsApiKey({ ios: { config: { googleMapsApiKey: '123' } } }, {})).toMatchObject(
      {
        GMSApiKey: '123',
      }
    );

    expect(setGoogleMapsApiKey({}, {})).toMatchObject({});
  });
});

describe(addMapsCocoaPods, () => {
  it(`adds maps pods to Podfile`, () => {
    const results = addMapsCocoaPods(PodfileBasic);
    // matches a static snapshot
    expect(results.contents).toMatchSnapshot();
    expect(results.contents).toMatch(/e9cc66c360abe50bc66d89fffb3c55b034d7d369/);
    // did add new content
    expect(results.didMerge).toBe(true);
    // didn't remove old content
    expect(results.didClear).toBe(false);

    const modded = addMapsCocoaPods(results.contents);
    // nothing changed
    expect(modded.didMerge).toBe(false);
    expect(modded.didClear).toBe(false);

    const modded2 = removeMapsCocoaPods(modded.contents);
    expect(modded2.contents).toBe(PodfileBasic);
    // didn't add new content
    expect(modded2.didMerge).toBe(false);
    // did remove the generated content
    expect(modded2.didClear).toBe(true);
  });
});

describe(addGoogleMapsAppDelegateImport, () => {
  it(`adds maps import to AppDelegate`, () => {
    const results = addGoogleMapsAppDelegateImport(
      rnFixture['ios/ReactNativeProject/AppDelegate.m']
    );
    // matches a static snapshot
    expect(results.contents).toMatchSnapshot();
    expect(results.contents).toMatch(/f2f83125c99c0d74b42a2612947510c4e08c423a/);
    // did add new content
    expect(results.didMerge).toBe(true);
    // didn't remove old content
    expect(results.didClear).toBe(false);

    const modded = addGoogleMapsAppDelegateImport(results.contents);
    // nothing changed
    expect(modded.didMerge).toBe(false);
    expect(modded.didClear).toBe(false);

    const modded2 = removeGoogleMapsAppDelegateImport(modded.contents);
    expect(modded2.contents).toBe(rnFixture['ios/ReactNativeProject/AppDelegate.m']);
    // didn't add new content
    expect(modded2.didMerge).toBe(false);
    // did remove the generated content
    expect(modded2.didClear).toBe(true);
  });
  it(`fails to add to a malformed podfile`, () => {
    expect(() => addGoogleMapsAppDelegateImport(`foobar`)).toThrow(/foobar/);
  });
});

describe(addGoogleMapsAppDelegateInit, () => {
  it(`adds maps import to AppDelegate`, () => {
    const results = addGoogleMapsAppDelegateInit(
      rnFixture['ios/ReactNativeProject/AppDelegate.m'],
      'mykey'
    );
    // matches a static snapshot
    expect(results.contents).toMatchSnapshot();
    expect(results.contents).toMatch(/97501819d6911e5f50d66c63d369b0cec62853c2/);
    // did add new content
    expect(results.didMerge).toBe(true);
    // didn't remove old content
    expect(results.didClear).toBe(false);

    const modded = addGoogleMapsAppDelegateInit(results.contents, 'mykey');
    // nothing changed
    expect(modded.didMerge).toBe(false);
    expect(modded.didClear).toBe(false);

    // Test that the block is updated when the API key changes
    const modded2 = addGoogleMapsAppDelegateInit(results.contents, 'mykey-2');
    expect(modded2.contents).not.toMatch(/97501819d6911e5f50d66c63d369b0cec62853c2/);
    expect(modded2.contents).toMatch(/a5c6f82bb5656264220096dea4cfdaa4383d60ab/);
    // nothing changed
    expect(modded2.didMerge).toBe(true);
    expect(modded2.didClear).toBe(true);

    const modded3 = removeGoogleMapsAppDelegateInit(modded.contents);
    expect(modded3.contents).toBe(rnFixture['ios/ReactNativeProject/AppDelegate.m']);
    // didn't add new content
    expect(modded3.didMerge).toBe(false);
    // did remove the generated content
    expect(modded3.didClear).toBe(true);
  });
  it(`adds maps import to Unimodules AppDelegate`, () => {
    const results = addGoogleMapsAppDelegateInit(UnimodulesAppDelegate, 'mykey');
    // matches a static snapshot
    expect(results.contents).toMatchSnapshot();
    expect(results.contents).toMatch(/97501819d6911e5f50d66c63d369b0cec62853c2/);
    // did add new content
    expect(results.didMerge).toBe(true);
    // didn't remove old content
    expect(results.didClear).toBe(false);
  });
  it(`adds maps import to Expo Modules AppDelegate`, () => {
    const results = addGoogleMapsAppDelegateInit(ExpoModulesAppDelegate, 'mykey');
    // matches a static snapshot
    expect(results.contents).toMatchSnapshot();
    expect(results.contents).toMatch(/97501819d6911e5f50d66c63d369b0cec62853c2/);
    // did add new content
    expect(results.didMerge).toBe(true);
    // didn't remove old content
    expect(results.didClear).toBe(false);
  });
  it(`adds maps import to Expo Modules SDK 44 AppDelegate`, () => {
    const results = addGoogleMapsAppDelegateInit(ExpoReactAppDelegate, 'mykey');
    // matches a static snapshot
    expect(results.contents).toMatchSnapshot();
    expect(results.contents).toMatch(/97501819d6911e5f50d66c63d369b0cec62853c2/);
    // did add new content
    expect(results.didMerge).toBe(true);
    // didn't remove old content
    expect(results.didClear).toBe(false);
  });

  it(`fails to add to a malformed app delegate`, () => {
    expect(() => addGoogleMapsAppDelegateInit(`foobar`, 'mykey')).toThrow(/foobar/);
  });
});
