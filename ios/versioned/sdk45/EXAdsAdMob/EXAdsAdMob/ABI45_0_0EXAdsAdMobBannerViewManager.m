#import <Foundation/Foundation.h>
#import <ABI45_0_0EXAdsAdMob/ABI45_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI45_0_0EXAdsAdMob/ABI45_0_0EXAdsAdMobBannerView.h>

@implementation ABI45_0_0EXAdsAdMobBannerViewManager

ABI45_0_0EX_EXPORT_MODULE(ExpoAdsAdMobBannerView);

- (NSString *)viewName
{
  return @"ExpoAdsAdMobBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"onSizeChange",
    @"onAdViewDidReceiveAd",
    @"onDidFailToReceiveAdWithError",
    @"onAdViewWillPresentScreen",
    @"onAdViewWillDismissScreen",
    @"onAdViewDidDismissScreen",
  ];
}

- (UIView *)view
{
  return [[ABI45_0_0EXAdsAdMobBannerView alloc] init];
}

ABI45_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI45_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI45_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI45_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI45_0_0EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI45_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

