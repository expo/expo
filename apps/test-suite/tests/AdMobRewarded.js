import { Platform } from 'react-native';
import { AdMobRewarded } from 'expo';
import { waitFor } from './helpers';

export const name = 'AdMobRewarded';

// 'ca-app-pub-3940256099942544/1712485313' should work, but it doesn't
// (source: https://developers.google.com/admob/ios/test-ads#sample_ad_units)
// It fails with "No ad returned from any ad server."
const validAdUnitID = 'ca-app-pub-3940256099942544/1712485313';
const invalidAdUnitID = 'ad';

export function test(t) {
  t.describe('AdMobRewarded', () => {
    t.describe('setTestDeviceID', () => {
      t.it('successfully sets Test Device ID for rewarded ads', () => {
        t.expect(AdMobRewarded.setTestDeviceID('EMULATOR')).not.toBeNull();
      });
    });

    t.describe('setAdUnitID', () => {
      t.it('successfully sets Ad Unit ID for rewarded ads', () => {
        t.expect(AdMobRewarded.setAdUnitID(validAdUnitID)).not.toBeNull();
      });
    });

    t.describe('getIsReadyAsync', () => {
      t.it('resolves with a boolean', async () => {
        const result = await AdMobRewarded.getIsReadyAsync();
        t.expect(typeof result).toEqual('boolean');
      });
    });

    if (Platform.OS === 'ios') {
      // NOTE(2018-03-08): Some of these tests are failing on iOS; disable for CI
      t.describe('requestAdAsync', () => {
        t.xdescribe('if adUnitID is valid', () => {
          t.beforeAll(() => AdMobRewarded.setAdUnitID(validAdUnitID));
          t.afterEach(
            async () =>
              await AdMobRewarded.showAdAsync().then(
                async () => await AdMobRewarded.dismissAdAsync()
              )
          );

          t.it('prepares an rewarded ad', async () => {
            await AdMobRewarded.requestAdAsync();
            t.expect(await AdMobRewarded.getIsReadyAsync()).toBe(true);
          });

          t.it('calls rewardedDidLoad listener', async () => {
            const didLoadListener = t.jasmine.createSpy('rewardedVideoDidLoad');
            AdMobRewarded.addEventListener('rewardedVideoDidLoad', didLoadListener);
            await AdMobRewarded.requestAdAsync();
            t.expect(didLoadListener).toHaveBeenCalled();
            AdMobRewarded.removeEventListener('rewardedVideoDidLoad', didLoadListener);
          });
        });

        t.describe('if adUnitID is invalid', () => {
          t.beforeAll(() => AdMobRewarded.setAdUnitID(invalidAdUnitID));
          t.it('rejects', async () => {
            let error = null;
            try {
              await AdMobRewarded.requestAdAsync();
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();
          });

          t.it('calls rewardedDidFailToLoad listener', async () => {
            const didFailToLoadListener = t.jasmine.createSpy('rewardedVideoDidFailToLoad');
            AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', didFailToLoadListener);
            try {
              await AdMobRewarded.requestAdAsync();
            } catch (_e) {}
            t.expect(didFailToLoadListener).toHaveBeenCalled();
            AdMobRewarded.removeEventListener('rewardedVideoDidFailToLoad', didFailToLoadListener);
          });
        });
      });

      t.describe('showAdAsync', () => {
        t.xdescribe('if an ad is prepared', () => {
          t.beforeEach(async () => {
            AdMobRewarded.setAdUnitID(validAdUnitID);
            await AdMobRewarded.requestAdAsync();
            t.expect(await AdMobRewarded.getIsReadyAsync()).toBe(true);
          });

          t.it('displays an rewarded ad', async () => {
            await AdMobRewarded.showAdAsync();
            await AdMobRewarded.dismissAdAsync();
          });

          t.it('calls rewardedVideoDidOpen listener', async () => {
            const didOpenListener = t.jasmine.createSpy('rewardedVideoDidOpen');
            AdMobRewarded.addEventListener('rewardedVideoDidOpen', didOpenListener);
            await AdMobRewarded.showAdAsync();
            t.expect(didOpenListener).toHaveBeenCalled();
            AdMobRewarded.removeEventListener('rewardedVideoDidOpen', didOpenListener);
            await AdMobRewarded.dismissAdAsync();
          });

          // TODO: Fix
          // t.it('calls rewardedVideoDidStart listener', async () => {
          //   const didStartListener = t.jasmine.createSpy('rewardedVideoDidStart');
          //   AdMobRewarded.addEventListener('rewardedVideoDidStart', didStartListener);
          //   await AdMobRewarded.showAdAsync();
          //   await waitFor(5000);
          //   t.expect(didStartListener).toHaveBeenCalled();
          //   AdMobRewarded.removeEventListener('rewardedVideoDidStart', didStartListener);
          //   await AdMobRewarded.dismissAdAsync();
          // });
        });

        t.describe('if an ad is not prepared', () => {
          t.beforeAll(async () => t.expect(await AdMobRewarded.getIsReadyAsync()).toBe(false));
          t.it('rejects', async () => {
            let error = null;
            try {
              await AdMobRewarded.showAdAsync();
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();
          });
        });
      });

      t.describe('dismissAdAsync', () => {
        t.xdescribe('if an ad is being shown', () => {
          t.beforeEach(async () => {
            AdMobRewarded.setAdUnitID(validAdUnitID);
            await AdMobRewarded.requestAdAsync();
            t.expect(await AdMobRewarded.getIsReadyAsync()).toBe(true);
            await AdMobRewarded.showAdAsync();
          });

          t.it('dismisses an rewarded ad', async () => {
            await AdMobRewarded.dismissAdAsync();
          });

          t.it('calls rewardedVideoDidClose listener', async () => {
            const didCloseListener = t.jasmine.createSpy('rewardedVideoDidClose');
            AdMobRewarded.addEventListener('rewardedVideoDidClose', didCloseListener);
            await AdMobRewarded.dismissAdAsync();
            t.expect(didCloseListener).toHaveBeenCalled();
            AdMobRewarded.removeEventListener('rewardedVideoDidClose', didCloseListener);
          });
        });

        t.describe('if an ad is not being shown', () => {
          t.it('rejects', async () => {
            let error = null;
            try {
              await AdMobRewarded.dismissAdAsync();
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();
          });
        });
      });
    }
  });
}
