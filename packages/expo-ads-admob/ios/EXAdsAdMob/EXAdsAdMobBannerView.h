#import <EXCore/EXDefines.h>
#import <EXCore/EXModuleRegistry.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EXAdsAdMobBannerView : UIView <GADBannerViewDelegate>

@property (nonatomic, copy) NSString *bannerSize;
@property (nonatomic, copy) NSString *adUnitID;
@property (nonatomic, copy) NSString *testDeviceID;

@property (nonatomic, copy) EXDirectEventBlock onSizeChange;
@property (nonatomic, copy) EXDirectEventBlock onAdViewDidReceiveAd;
@property (nonatomic, copy) EXDirectEventBlock onDidFailToReceiveAdWithError;
@property (nonatomic, copy) EXDirectEventBlock onAdViewWillPresentScreen;
@property (nonatomic, copy) EXDirectEventBlock onAdViewWillDismissScreen;
@property (nonatomic, copy) EXDirectEventBlock onAdViewDidDismissScreen;
@property (nonatomic, copy) EXDirectEventBlock onAdViewWillLeaveApplication;

- (GADAdSize)getAdSizeFromString:(NSString *)bannerSize;
- (void)loadBanner;

- (void)setAdUnitID:(NSString *)adUnitID;
- (void)setTestDeviceID:(NSString *)testDeviceID;

@end
