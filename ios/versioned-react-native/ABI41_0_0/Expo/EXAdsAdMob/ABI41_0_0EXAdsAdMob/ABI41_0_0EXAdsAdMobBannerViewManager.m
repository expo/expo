#import <Foundation/Foundation.h>
#import <ABI41_0_0EXAdsAdMob/ABI41_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI41_0_0EXAdsAdMob/ABI41_0_0EXAdsAdMobBannerView.h>

@implementation ABI41_0_0EXAdsAdMobBannerViewManager

ABI41_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI41_0_0EXAdsAdMobBannerView alloc] init];
}

ABI41_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI41_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI41_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI41_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI41_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI41_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

