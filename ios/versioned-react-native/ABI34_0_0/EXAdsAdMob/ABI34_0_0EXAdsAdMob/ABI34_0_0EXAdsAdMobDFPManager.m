#import <Foundation/Foundation.h>
#import <ABI34_0_0EXAdsAdMob/ABI34_0_0EXAdsAdMobDFPManager.h>
#import <ABI34_0_0EXAdsAdMob/ABI34_0_0EXAdsDFPBannerView.h>

@implementation ABI34_0_0EXAdsAdMobDFPManager

ABI34_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI34_0_0EXAdsDFPBannerView alloc] init];
}

ABI34_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI34_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI34_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI34_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI34_0_0UM_VIEW_PROPERTY(testDeviceID, NSString *, ABI34_0_0EXAdsDFPBannerView)
{
  [view setTestDeviceID:value];
}

@end
