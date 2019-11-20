import { Platform } from 'react-native';
import { AdMobRewarded, setTestDeviceIDAsync } from 'expo-ads-admob';
import { waitFor } from './helpers';

export const name = 'AdMobRewarded';

export function canRunAsync({ isDetox }) {
  return !isDetox;
}

// 'ca-app-pub-3940256099942544/1712485313' should work, but it doesn't
// (source: https://developers.google.com/admob/ios/test-ads#sample_ad_units)
// It fails with "No ad returned from any ad server."
const validAdUnitID = 'ca-app-pub-3940256099942544/1712485313';
const invalidAdUnitID = 'ad';

export function test({
  describe,
  beforeAll,
  beforeEach,
  xdescribe,
  xit,
  fit,
  afterEach,
  it,
  expect,
  jasmine,
  ...t
}) {
  describe('AdMobRewarded', () => {
    describe('setTestDeviceIDAsync', () => {
      it('successfully sets Test Device ID for rewarded ads', () => {
        expect(setTestDeviceIDAsync('EMULATOR')).not.toBeNull();
      });
    });

    describe('setAdUnitID', () => {
      it('successfully sets Ad Unit ID for rewarded ads', () => {
        expect(AdMobRewarded.setAdUnitID(validAdUnitID)).not.toBeNull();
      });
    });

    describe('getIsReadyAsync', () => {
      it('resolves with a boolean', async () => {
        const result = await AdMobRewarded.getIsReadyAsync();
        expect(typeof result).toEqual('boolean');
      });
    });

    if (Platform.OS === 'ios') {
      // NOTE(2018-03-08): Some of these tests are failing on iOS; disable for CI
      describe('requestAdAsync', () => {
        xdescribe('if adUnitID is valid', () => {
          beforeAll(() => AdMobRewarded.setAdUnitID(validAdUnitID));
          afterEach(
            async () =>
              await AdMobRewarded.showAdAsync().then(
                async () => await AdMobRewarded.dismissAdAsync()
              )
          );

          it('prepares an rewarded ad', async () => {
            await AdMobRewarded.requestAdAsync();
            expect(await AdMobRewarded.getIsReadyAsync()).toBe(true);
          });

          it('calls rewardedDidLoad listener', async () => {
            const didLoadListener = jasmine.createSpy('rewardedVideoDidLoad');
            AdMobRewarded.addEventListener('rewardedVideoDidLoad', didLoadListener);
            await AdMobRewarded.requestAdAsync();
            expect(didLoadListener).toHaveBeenCalled();
            AdMobRewarded.removeEventListener('rewardedVideoDidLoad', didLoadListener);
          });
        });

        describe('if adUnitID is invalid', () => {
          beforeAll(() => AdMobRewarded.setAdUnitID(invalidAdUnitID));
          it('rejects', async () => {
            let error = null;
            try {
              await AdMobRewarded.requestAdAsync();
            } catch (e) {
              error = e;
            }
            expect(error).toBeDefined();
          });

          it('calls rewardedDidFailToLoad listener', async () => {
            const didFailToLoadListener = jasmine.createSpy('rewardedVideoDidFailToLoad');
            AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', didFailToLoadListener);
            try {
              await AdMobRewarded.requestAdAsync();
            } catch (_e) {}
            expect(didFailToLoadListener).toHaveBeenCalled();
            AdMobRewarded.removeEventListener('rewardedVideoDidFailToLoad', didFailToLoadListener);
          });
        });
      });

      describe('showAdAsync', () => {
        xdescribe('if an ad is prepared', () => {
          beforeEach(async () => {
            AdMobRewarded.setAdUnitID(validAdUnitID);
            await AdMobRewarded.requestAdAsync();
            expect(await AdMobRewarded.getIsReadyAsync()).toBe(true);
          });

          it('displays an rewarded ad', async () => {
            await AdMobRewarded.showAdAsync();
            await AdMobRewarded.dismissAdAsync();
          });

          it('calls rewardedVideoDidOpen listener', async () => {
            const didOpenListener = jasmine.createSpy('rewardedVideoDidOpen');
            AdMobRewarded.addEventListener('rewardedVideoDidOpen', didOpenListener);
            await AdMobRewarded.showAdAsync();
            expect(didOpenListener).toHaveBeenCalled();
            AdMobRewarded.removeEventListener('rewardedVideoDidOpen', didOpenListener);
            await AdMobRewarded.dismissAdAsync();
          });

          // TODO: Fix
          // it('calls rewardedVideoDidStart listener', async () => {
          //   const didStartListener = jasmine.createSpy('rewardedVideoDidStart');
          //   AdMobRewarded.addEventListener('rewardedVideoDidStart', didStartListener);
          //   await AdMobRewarded.showAdAsync();
          //   await waitFor(5000);
          //   expect(didStartListener).toHaveBeenCalled();
          //   AdMobRewarded.removeEventListener('rewardedVideoDidStart', didStartListener);
          //   await AdMobRewarded.dismissAdAsync();
          // });
        });

        describe('if an ad is not prepared', () => {
          beforeAll(async () => expect(await AdMobRewarded.getIsReadyAsync()).toBe(false));
          it('rejects', async () => {
            let error = null;
            try {
              await AdMobRewarded.showAdAsync();
            } catch (e) {
              error = e;
            }
            expect(error).toBeDefined();
          });
        });
      });

      describe('dismissAdAsync', () => {
        xdescribe('if an ad is being shown', () => {
          beforeEach(async () => {
            AdMobRewarded.setAdUnitID(validAdUnitID);
            await AdMobRewarded.requestAdAsync();
            expect(await AdMobRewarded.getIsReadyAsync()).toBe(true);
            await AdMobRewarded.showAdAsync();
          });

          it('dismisses an rewarded ad', async () => {
            await AdMobRewarded.dismissAdAsync();
          });

          it('calls rewardedVideoDidClose listener', async () => {
            const didCloseListener = jasmine.createSpy('rewardedVideoDidClose');
            AdMobRewarded.addEventListener('rewardedVideoDidClose', didCloseListener);
            await AdMobRewarded.dismissAdAsync();
            expect(didCloseListener).toHaveBeenCalled();
            AdMobRewarded.removeEventListener('rewardedVideoDidClose', didCloseListener);
          });
        });

        describe('if an ad is not being shown', () => {
          it('rejects', async () => {
            let error = null;
            try {
              await AdMobRewarded.dismissAdAsync();
            } catch (e) {
              error = e;
            }
            expect(error).toBeDefined();
          });
        });
      });
    }
  });
}
