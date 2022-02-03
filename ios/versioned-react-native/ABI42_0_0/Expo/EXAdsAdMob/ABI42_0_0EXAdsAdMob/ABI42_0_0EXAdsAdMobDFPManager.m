#import <Foundation/Foundation.h>
#import <ABI42_0_0EXAdsAdMob/ABI42_0_0EXAdsAdMobDFPManager.h>
#import <ABI42_0_0EXAdsAdMob/ABI42_0_0EXAdsDFPBannerView.h>

@implementation ABI42_0_0EXAdsAdMobDFPManager

ABI42_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI42_0_0EXAdsDFPBannerView alloc] init];
}

ABI42_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI42_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI42_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI42_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI42_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI42_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
