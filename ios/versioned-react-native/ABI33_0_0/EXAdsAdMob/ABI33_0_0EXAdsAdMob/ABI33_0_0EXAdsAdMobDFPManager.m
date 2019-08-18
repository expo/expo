#import <Foundation/Foundation.h>
#import <ABI33_0_0EXAdsAdMob/ABI33_0_0EXAdsAdMobDFPManager.h>
#import <ABI33_0_0EXAdsAdMob/ABI33_0_0EXAdsDFPBannerView.h>

@implementation ABI33_0_0EXAdsAdMobDFPManager

ABI33_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI33_0_0EXAdsDFPBannerView alloc] init];
}

ABI33_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI33_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI33_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI33_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI33_0_0UM_VIEW_PROPERTY(testDeviceID, NSString *, ABI33_0_0EXAdsDFPBannerView)
{
  [view setTestDeviceID:value];
}

@end
