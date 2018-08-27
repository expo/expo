#import <EXCore/EXDefines.h>
#import <EXCore/EXModuleRegistry.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface EXAdsDFPBannerView : UIView <GADBannerViewDelegate, GADAppEventDelegate>

@property (nonatomic, copy) NSString *bannerSize;
@property (nonatomic, copy) NSString *adUnitID;
@property (nonatomic, copy) NSString *testDeviceID;

@property (nonatomic, copy) EXDirectEventBlock onSizeChange;
@property (nonatomic, copy) EXDirectEventBlock onAdmobDispatchAppEvent;
@property (nonatomic, copy) EXDirectEventBlock onAdViewDidReceiveAd;
@property (nonatomic, copy) EXDirectEventBlock onDidFailToReceiveAdWithError;
@property (nonatomic, copy) EXDirectEventBlock onAdViewWillPresentScreen;
@property (nonatomic, copy) EXDirectEventBlock onAdViewWillDismissScreen;
@property (nonatomic, copy) EXDirectEventBlock onAdViewDidDismissScreen;
@property (nonatomic, copy) EXDirectEventBlock onAdViewWillLeaveApplication;

- (GADAdSize)getAdSizeFromString:(NSString *)bannerSize;
- (void)loadBanner;

@end
