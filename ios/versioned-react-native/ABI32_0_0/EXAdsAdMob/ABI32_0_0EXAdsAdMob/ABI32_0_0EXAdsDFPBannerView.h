#import <ABI32_0_0EXCore/ABI32_0_0EXDefines.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@interface ABI32_0_0EXAdsDFPBannerView : UIView <GADBannerViewDelegate, GADAppEventDelegate>

@property (nonatomic, copy) NSString *bannerSize;
@property (nonatomic, copy) NSString *adUnitID;
@property (nonatomic, copy) NSString *testDeviceID;

@property (nonatomic, copy) ABI32_0_0EXDirectEventBlock onSizeChange;
@property (nonatomic, copy) ABI32_0_0EXDirectEventBlock onAdmobDispatchAppEvent;
@property (nonatomic, copy) ABI32_0_0EXDirectEventBlock onAdViewDidReceiveAd;
@property (nonatomic, copy) ABI32_0_0EXDirectEventBlock onDidFailToReceiveAdWithError;
@property (nonatomic, copy) ABI32_0_0EXDirectEventBlock onAdViewWillPresentScreen;
@property (nonatomic, copy) ABI32_0_0EXDirectEventBlock onAdViewWillDismissScreen;
@property (nonatomic, copy) ABI32_0_0EXDirectEventBlock onAdViewDidDismissScreen;
@property (nonatomic, copy) ABI32_0_0EXDirectEventBlock onAdViewWillLeaveApplication;

- (GADAdSize)getAdSizeFromString:(NSString *)bannerSize;
- (void)loadBanner;

@end
