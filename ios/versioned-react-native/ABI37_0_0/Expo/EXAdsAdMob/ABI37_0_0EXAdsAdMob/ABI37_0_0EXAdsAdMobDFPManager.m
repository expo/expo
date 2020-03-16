#import <Foundation/Foundation.h>
#import <ABI37_0_0EXAdsAdMob/ABI37_0_0EXAdsAdMobDFPManager.h>
#import <ABI37_0_0EXAdsAdMob/ABI37_0_0EXAdsDFPBannerView.h>

@implementation ABI37_0_0EXAdsAdMobDFPManager

ABI37_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI37_0_0EXAdsDFPBannerView alloc] init];
}

ABI37_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI37_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI37_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI37_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI37_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI37_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
