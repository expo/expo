#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDefines.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistry.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI45_0_0EXAdsGAMBannerView : UIView <GADBannerViewDelegate, GADAppEventDelegate>

@property (nonatomic, copy) NSString *bannerSize;
@property (nonatomic, copy) NSString *adUnitID;
@property (nonatomic, copy) NSDictionary *additionalRequestParams;

@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onSizeChange;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onAdmobDispatchAppEvent;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onAdViewDidReceiveAd;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onDidFailToReceiveAdWithError;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onAdViewWillPresentScreen;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onAdViewWillDismissScreen;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onAdViewDidDismissScreen;

- (GADAdSize)getAdSizeFromString:(NSString *)bannerSize;
- (void)loadBanner;

@end
