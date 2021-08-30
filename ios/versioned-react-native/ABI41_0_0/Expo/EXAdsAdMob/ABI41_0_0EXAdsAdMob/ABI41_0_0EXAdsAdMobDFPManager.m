#import <Foundation/Foundation.h>
#import <ABI41_0_0EXAdsAdMob/ABI41_0_0EXAdsAdMobDFPManager.h>
#import <ABI41_0_0EXAdsAdMob/ABI41_0_0EXAdsDFPBannerView.h>

@implementation ABI41_0_0EXAdsAdMobDFPManager

ABI41_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI41_0_0EXAdsDFPBannerView alloc] init];
}

ABI41_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI41_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI41_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI41_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI41_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI41_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
