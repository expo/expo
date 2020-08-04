#import <Foundation/Foundation.h>
#import <ABI38_0_0EXAdsAdMob/ABI38_0_0EXAdsAdMobDFPManager.h>
#import <ABI38_0_0EXAdsAdMob/ABI38_0_0EXAdsDFPBannerView.h>

@implementation ABI38_0_0EXAdsAdMobDFPManager

ABI38_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI38_0_0EXAdsDFPBannerView alloc] init];
}

ABI38_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI38_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI38_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI38_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI38_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI38_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
