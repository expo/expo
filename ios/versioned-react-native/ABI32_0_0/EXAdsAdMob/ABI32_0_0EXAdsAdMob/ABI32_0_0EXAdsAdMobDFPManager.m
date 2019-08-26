#import <Foundation/Foundation.h>
#import <ABI32_0_0EXAdsAdMob/ABI32_0_0EXAdsAdMobDFPManager.h>
#import <ABI32_0_0EXAdsAdMob/ABI32_0_0EXAdsDFPBannerView.h>

@implementation ABI32_0_0EXAdsAdMobDFPManager

ABI32_0_0EX_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI32_0_0EXAdsDFPBannerView alloc] init];
}

ABI32_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI32_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI32_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI32_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI32_0_0EX_VIEW_PROPERTY(testDeviceID, NSString *, ABI32_0_0EXAdsDFPBannerView)
{
  [view setTestDeviceID:value];
}

@end
