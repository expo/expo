#import <Foundation/Foundation.h>
#import <ABI39_0_0EXAdsAdMob/ABI39_0_0EXAdsAdMobDFPManager.h>
#import <ABI39_0_0EXAdsAdMob/ABI39_0_0EXAdsDFPBannerView.h>

@implementation ABI39_0_0EXAdsAdMobDFPManager

ABI39_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI39_0_0EXAdsDFPBannerView alloc] init];
}

ABI39_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI39_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI39_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI39_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI39_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI39_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
