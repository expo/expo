#import <Foundation/Foundation.h>
#import <ABI40_0_0EXAdsAdMob/ABI40_0_0EXAdsAdMobDFPManager.h>
#import <ABI40_0_0EXAdsAdMob/ABI40_0_0EXAdsDFPBannerView.h>

@implementation ABI40_0_0EXAdsAdMobDFPManager

ABI40_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI40_0_0EXAdsDFPBannerView alloc] init];
}

ABI40_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI40_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI40_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI40_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI40_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI40_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
