#import <Foundation/Foundation.h>
#import <ABI40_0_0EXAdsAdMob/ABI40_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI40_0_0EXAdsAdMob/ABI40_0_0EXAdsAdMobBannerView.h>

@implementation ABI40_0_0EXAdsAdMobBannerViewManager

ABI40_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

- (NSString *)viewName
{
  return @"ExpoAdsAdMobBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
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
  return [[ABI40_0_0EXAdsAdMobBannerView alloc] init];
}

ABI40_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI40_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI40_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI40_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI40_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI40_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

