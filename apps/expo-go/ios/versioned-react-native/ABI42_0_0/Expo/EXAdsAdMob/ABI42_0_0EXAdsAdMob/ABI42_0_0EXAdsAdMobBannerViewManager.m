#import <Foundation/Foundation.h>
#import <ABI42_0_0EXAdsAdMob/ABI42_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI42_0_0EXAdsAdMob/ABI42_0_0EXAdsAdMobBannerView.h>

@implementation ABI42_0_0EXAdsAdMobBannerViewManager

ABI42_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI42_0_0EXAdsAdMobBannerView alloc] init];
}

ABI42_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI42_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI42_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI42_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI42_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI42_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

