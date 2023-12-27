#import <Foundation/Foundation.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMobDFPManager.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsDFPBannerView.h>

@implementation ABI43_0_0EXAdsAdMobDFPManager

ABI43_0_0EX_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI43_0_0EXAdsDFPBannerView alloc] init];
}

ABI43_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI43_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI43_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI43_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI43_0_0EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI43_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
