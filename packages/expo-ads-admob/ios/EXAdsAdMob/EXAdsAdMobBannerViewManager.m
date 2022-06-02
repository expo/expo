#import <Foundation/Foundation.h>
#import <EXAdsAdMob/EXAdsAdMobBannerViewManager.h>
#import <EXAdsAdMob/EXAdsAdMobBannerView.h>

@implementation EXAdsAdMobBannerViewManager

EX_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[EXAdsAdMobBannerView alloc] init];
}

EX_VIEW_PROPERTY(bannerSize, NSString *, EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

EX_VIEW_PROPERTY(adUnitID, NSString *, EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

