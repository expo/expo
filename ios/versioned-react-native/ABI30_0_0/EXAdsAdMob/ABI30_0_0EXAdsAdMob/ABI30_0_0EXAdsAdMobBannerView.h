#import <ABI30_0_0EXCore/ABI30_0_0EXDefines.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI30_0_0EXAdsAdMobBannerView : UIView <GADBannerViewDelegate>

@property (nonatomic, copy) NSString *bannerSize;
@property (nonatomic, copy) NSString *adUnitID;
@property (nonatomic, copy) NSString *testDeviceID;

@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onSizeChange;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onAdViewDidReceiveAd;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onDidFailToReceiveAdWithError;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onAdViewWillPresentScreen;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onAdViewWillDismissScreen;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onAdViewDidDismissScreen;
@property (nonatomic, copy) ABI30_0_0EXDirectEventBlock onAdViewWillLeaveApplication;

- (GADAdSize)getAdSizeFromString:(NSString *)bannerSize;
- (void)loadBanner;

- (void)setAdUnitID:(NSString *)adUnitID;
- (void)setTestDeviceID:(NSString *)testDeviceID;

@end
