#import <Foundation/Foundation.h>
#import <ABI31_0_0EXAdsAdMob/ABI31_0_0EXAdsAdMobDFPManager.h>
#import <ABI31_0_0EXAdsAdMob/ABI31_0_0EXAdsDFPBannerView.h>

@implementation ABI31_0_0EXAdsAdMobDFPManager

ABI31_0_0EX_EXPORT_MODULE(ExpoPublisherBannerView);

- (NSString *)viewName
{
  return @"ExpoAdsPublisherBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onAdmobDispatchAppEvent",
           @"onAdViewDidDismissScreen",
           @"onAdViewDidReceiveAd",
           @"onAdViewWillDismissScreen",
           @"onAdViewWillLeaveApplication",
           @"onAdViewWillPresentScreen",
           @"onDidFailToReceiveAdWithError",
           @"onSizeChange",
           ];
}

- (UIView *)view
{
  return [[ABI31_0_0EXAdsDFPBannerView alloc] init];
}

ABI31_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI31_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI31_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI31_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI31_0_0EX_VIEW_PROPERTY(testDeviceID, NSString *, ABI31_0_0EXAdsDFPBannerView)
{
  [view setTestDeviceID:value];
}

@end
