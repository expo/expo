#import <Foundation/Foundation.h>
#import <ABI44_0_0EXAdsAdMob/ABI44_0_0EXAdsAdMobDFPManager.h>
#import <ABI44_0_0EXAdsAdMob/ABI44_0_0EXAdsDFPBannerView.h>

@implementation ABI44_0_0EXAdsAdMobDFPManager

ABI44_0_0EX_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI44_0_0EXAdsDFPBannerView alloc] init];
}

ABI44_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI44_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI44_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI44_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI44_0_0EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI44_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
