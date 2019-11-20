import { Platform } from 'react-native';
import { AdMobInterstitial, setTestDeviceIDAsync } from 'expo-ads-admob';

export const name = 'AdMobInterstitial';

export function canRunAsync({ isDetox }) {
  return !isDetox;
}

export function test({ describe, beforeEach, afterEach, it, expect, beforeAll, jasmine, ...t }) {
  describe('AdMobInterstitial', () => {
    describe('setTestDeviceIDAsync', () => {
      it('successfully sets Test Device ID for interstitial ads', () => {
        expect(setTestDeviceIDAsync('EMULATOR')).not.toBeNull();
      });
    });

    describe('setAdUnitID', () => {
      it('successfully sets Ad Unit ID for interstitial ads', () => {
        expect(
          AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712')
        ).not.toBeNull();
      });
    });

    describe('getIsReadyAsync', () => {
      it('resolves with a boolean', async () => {
        const result = await AdMobInterstitial.getIsReadyAsync();
        expect(typeof result).toEqual('boolean');
      });
    });

    if (Platform.OS === 'ios') {
      describe('requestAdAsync', () => {
        describe('if adUnitID is valid', () => {
          beforeAll(() => AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712'));
          afterEach(
            async () =>
              await AdMobInterstitial.showAdAsync().then(
                async () => await AdMobInterstitial.dismissAdAsync()
              )
          );

          it('prepares an interstitial ad', async () => {
            await AdMobInterstitial.requestAdAsync();
            expect(await AdMobInterstitial.getIsReadyAsync()).toBe(true);
          });
        });

        describe('if adUnitID is invalid', () => {
          beforeAll(() => AdMobInterstitial.setAdUnitID('ad'));
          it('rejects', async () => {
            let error = null;
            try {
              await AdMobInterstitial.requestAdAsync();
            } catch (e) {
              error = e;
            }
            expect(error).toBeDefined();
          });
        });
      });

      describe('requestAdAsync', () => {
        describe('if adUnitID is valid', () => {
          beforeAll(() => AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712'));
          afterEach(
            async () =>
              await AdMobInterstitial.showAdAsync().then(
                async () => await AdMobInterstitial.dismissAdAsync()
              )
          );

          it('prepares an interstitial ad', async () => {
            await AdMobInterstitial.requestAdAsync();
            expect(await AdMobInterstitial.getIsReadyAsync()).toBe(true);
          });

          it('calls interstitialDidLoad listener', async () => {
            const didLoadListener = jasmine.createSpy('interstitialDidLoad');
            AdMobInterstitial.addEventListener('interstitialDidLoad', didLoadListener);
            await AdMobInterstitial.requestAdAsync();
            expect(didLoadListener).toHaveBeenCalled();
            AdMobInterstitial.removeEventListener('interstitialDidLoad', didLoadListener);
          });
        });

        describe('if adUnitID is invalid', () => {
          beforeAll(() => AdMobInterstitial.setAdUnitID('ad'));
          it('rejects', async () => {
            let error = null;
            try {
              await AdMobInterstitial.requestAdAsync();
            } catch (e) {
              error = e;
            }
            expect(error).toBeDefined();
          });

          it('calls interstitialDidFailToLoad listener', async () => {
            const didFailToLoadListener = jasmine.createSpy('interstitialDidFailToLoad');
            AdMobInterstitial.addEventListener('interstitialDidFailToLoad', didFailToLoadListener);
            try {
              await AdMobInterstitial.requestAdAsync();
            } catch (_e) {}
            expect(didFailToLoadListener).toHaveBeenCalled();
            AdMobInterstitial.removeEventListener(
              'interstitialDidFailToLoad',
              didFailToLoadListener
            );
          });
        });
      });

      describe('showAdAsync', () => {
        describe('if an ad is prepared', () => {
          beforeEach(async () => {
            AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
            await AdMobInterstitial.requestAdAsync();
            expect(await AdMobInterstitial.getIsReadyAsync()).toBe(true);
          });

          it('displays an interstitial ad', async () => {
            await AdMobInterstitial.showAdAsync();
            await AdMobInterstitial.dismissAdAsync();
          });

          it('calls interstitialDidOpen listener', async () => {
            const didOpenListener = jasmine.createSpy('interstitialDidOpen');
            AdMobInterstitial.addEventListener('interstitialDidOpen', didOpenListener);
            await AdMobInterstitial.showAdAsync();
            expect(didOpenListener).toHaveBeenCalled();
            AdMobInterstitial.removeEventListener('interstitialDidOpen', didOpenListener);
            await AdMobInterstitial.dismissAdAsync();
          });
        });

        describe('if an ad is not prepared', () => {
          beforeAll(async () => expect(await AdMobInterstitial.getIsReadyAsync()).toBe(false));
          it('rejects', async () => {
            let error = null;
            try {
              await AdMobInterstitial.showAdAsync();
            } catch (e) {
              error = e;
            }
            expect(error).toBeDefined();
          });
        });
      });

      describe('dismissAdAsync', () => {
        describe('if an ad is being shown', () => {
          beforeEach(async () => {
            AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
            await AdMobInterstitial.requestAdAsync();
            expect(await AdMobInterstitial.getIsReadyAsync()).toBe(true);
            await AdMobInterstitial.showAdAsync();
          });

          it('dismisses an interstitial ad', async () => {
            await AdMobInterstitial.dismissAdAsync();
          });

          it('calls interstitialDidClose listener', async () => {
            const didCloseListener = jasmine.createSpy('interstitialDidClose');
            AdMobInterstitial.addEventListener('interstitialDidClose', didCloseListener);
            await AdMobInterstitial.dismissAdAsync();
            expect(didCloseListener).toHaveBeenCalled();
            AdMobInterstitial.removeEventListener('interstitialDidClose', didCloseListener);
          });
        });

        describe('if an ad is not being shown', () => {
          it('rejects', async () => {
            let error = null;
            try {
              await AdMobInterstitial.dismissAdAsync();
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
