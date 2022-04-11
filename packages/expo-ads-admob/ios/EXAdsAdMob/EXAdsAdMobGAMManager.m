#import <Foundation/Foundation.h>
#import <EXAdsAdMob/EXAdsAdMobGAMManager.h>
#import <EXAdsAdMob/EXAdsGAMBannerView.h>

@implementation EXAdsAdMobGAMManager

EX_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[EXAdsGAMBannerView alloc] init];
}

EX_VIEW_PROPERTY(bannerSize, NSString *, EXAdsGAMBannerView)
{
  [view setBannerSize:value];
}

EX_VIEW_PROPERTY(adUnitID, NSString *, EXAdsGAMBannerView)
{
  [view setAdUnitID:value];
}

EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, EXAdsGAMBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
