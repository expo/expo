import { Platform } from 'react-native';
import { AdMobInterstitial } from 'expo';

export const name = 'AdMobInterstitial';

export function test(t) {
  t.describe('AdMobInterstitial', () => {
    t.describe('setTestDeviceID', () => {
      t.it('successfully sets Test Device ID for interstitial ads', () => {
        t.expect(AdMobInterstitial.setTestDeviceID('EMULATOR')).not.toBeNull();
      });
    });

    t.describe('setAdUnitID', () => {
      t.it('successfully sets Ad Unit ID for interstitial ads', () => {
        t
          .expect(AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712'))
          .not.toBeNull();
      });
    });

    t.describe('getIsReadyAsync', () => {
      t.it('resolves with a boolean', async () => {
        const result = await AdMobInterstitial.getIsReadyAsync();
        t.expect(typeof result).toEqual('boolean');
      });
    });

    if (Platform.OS === 'ios') {
      t.describe('requestAdAsync', () => {
        t.describe('if adUnitID is valid', () => {
          t.beforeAll(() =>
            AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712')
          );
          t.afterEach(
            async () =>
              await AdMobInterstitial.showAdAsync().then(
                async () => await AdMobInterstitial.dismissAdAsync()
              )
          );

          t.it('prepares an interstitial ad', async () => {
            await AdMobInterstitial.requestAdAsync();
            t.expect(await AdMobInterstitial.getIsReadyAsync()).toBe(true);
          });
        });

        t.describe('if adUnitID is invalid', () => {
          t.beforeAll(() => AdMobInterstitial.setAdUnitID('ad'));
          t.it('rejects', async () => {
            let error = null;
            try {
              await AdMobInterstitial.requestAdAsync();
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();
          });
        });
      });

      t.describe('requestAdAsync', () => {
        t.describe('if adUnitID is valid', () => {
          t.beforeAll(() =>
            AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712')
          );
          t.afterEach(
            async () =>
              await AdMobInterstitial.showAdAsync().then(
                async () => await AdMobInterstitial.dismissAdAsync()
              )
          );

          t.it('prepares an interstitial ad', async () => {
            await AdMobInterstitial.requestAdAsync();
            t.expect(await AdMobInterstitial.getIsReadyAsync()).toBe(true);
          });

          t.it('calls interstitialDidLoad listener', async () => {
            const didLoadListener = t.jasmine.createSpy('interstitialDidLoad');
            AdMobInterstitial.addEventListener('interstitialDidLoad', didLoadListener);
            await AdMobInterstitial.requestAdAsync();
            t.expect(didLoadListener).toHaveBeenCalled();
            AdMobInterstitial.removeEventListener('interstitialDidLoad', didLoadListener);
          });
        });

        t.describe('if adUnitID is invalid', () => {
          t.beforeAll(() => AdMobInterstitial.setAdUnitID('ad'));
          t.it('rejects', async () => {
            let error = null;
            try {
              await AdMobInterstitial.requestAdAsync();
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();
          });

          t.it('calls interstitialDidFailToLoad listener', async () => {
            const didFailToLoadListener = t.jasmine.createSpy('interstitialDidFailToLoad');
            AdMobInterstitial.addEventListener('interstitialDidFailToLoad', didFailToLoadListener);
            try {
              await AdMobInterstitial.requestAdAsync();
            } catch (_e) {}
            t.expect(didFailToLoadListener).toHaveBeenCalled();
            AdMobInterstitial.removeEventListener(
              'interstitialDidFailToLoad',
              didFailToLoadListener
            );
          });
        });
      });

      t.describe('showAdAsync', () => {
        t.describe('if an ad is prepared', () => {
          t.beforeEach(async () => {
            AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
            await AdMobInterstitial.requestAdAsync();
            t.expect(await AdMobInterstitial.getIsReadyAsync()).toBe(true);
          });

          t.it('displays an interstitial ad', async () => {
            await AdMobInterstitial.showAdAsync();
            await AdMobInterstitial.dismissAdAsync();
          });

          t.it('calls interstitialDidOpen listener', async () => {
            const didOpenListener = t.jasmine.createSpy('interstitialDidOpen');
            AdMobInterstitial.addEventListener('interstitialDidOpen', didOpenListener);
            await AdMobInterstitial.showAdAsync();
            t.expect(didOpenListener).toHaveBeenCalled();
            AdMobInterstitial.removeEventListener('interstitialDidOpen', didOpenListener);
            await AdMobInterstitial.dismissAdAsync();
          });
        });

        t.describe('if an ad is not prepared', () => {
          t.beforeAll(async () => t.expect(await AdMobInterstitial.getIsReadyAsync()).toBe(false));
          t.it('rejects', async () => {
            let error = null;
            try {
              await AdMobInterstitial.showAdAsync();
            } catch (e) {
              error = e;
            }
            t.expect(error).toBeDefined();
          });
        });
      });

      t.describe('dismissAdAsync', () => {
        t.describe('if an ad is being shown', () => {
          t.beforeEach(async () => {
            AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
            await AdMobInterstitial.requestAdAsync();
            t.expect(await AdMobInterstitial.getIsReadyAsync()).toBe(true);
            await AdMobInterstitial.showAdAsync();
          });

          t.it('dismisses an interstitial ad', async () => {
            await AdMobInterstitial.dismissAdAsync();
          });

          t.it('calls interstitialDidClose listener', async () => {
            const didCloseListener = t.jasmine.createSpy('interstitialDidClose');
            AdMobInterstitial.addEventListener('interstitialDidClose', didCloseListener);
            await AdMobInterstitial.dismissAdAsync();
            t.expect(didCloseListener).toHaveBeenCalled();
            AdMobInterstitial.removeEventListener('interstitialDidClose', didCloseListener);
          });
        });

        t.describe('if an ad is not being shown', () => {
          t.it('rejects', async () => {
            let error = null;
            try {
              await AdMobInterstitial.dismissAdAsync();
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
