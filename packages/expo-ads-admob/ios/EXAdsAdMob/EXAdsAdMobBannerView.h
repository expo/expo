#import <UMCore/UMDefines.h>
#import <UMCore/UMModuleRegistry.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EXAdsAdMobBannerView : UIView <GADBannerViewDelegate>

@property (nonatomic, copy) NSString *bannerSize;
@property (nonatomic, copy) NSString *adUnitID;
@property (nonatomic, copy) NSString *testDeviceID;

@property (nonatomic, copy) UMDirectEventBlock onSizeChange;
@property (nonatomic, copy) UMDirectEventBlock onAdViewDidReceiveAd;
@property (nonatomic, copy) UMDirectEventBlock onDidFailToReceiveAdWithError;
@property (nonatomic, copy) UMDirectEventBlock onAdViewWillPresentScreen;
@property (nonatomic, copy) UMDirectEventBlock onAdViewWillDismissScreen;
@property (nonatomic, copy) UMDirectEventBlock onAdViewDidDismissScreen;
@property (nonatomic, copy) UMDirectEventBlock onAdViewWillLeaveApplication;

- (GADAdSize)getAdSizeFromString:(NSString *)bannerSize;
- (void)loadBanner;

- (void)setAdUnitID:(NSString *)adUnitID;
- (void)setTestDeviceID:(NSString *)testDeviceID;

@end
