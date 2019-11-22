#import <Foundation/Foundation.h>
#import <ABI36_0_0EXAdsAdMob/ABI36_0_0EXAdsAdMobDFPManager.h>
#import <ABI36_0_0EXAdsAdMob/ABI36_0_0EXAdsDFPBannerView.h>

@implementation ABI36_0_0EXAdsAdMobDFPManager

ABI36_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI36_0_0EXAdsDFPBannerView alloc] init];
}

ABI36_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI36_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI36_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI36_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI36_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI36_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
