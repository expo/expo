#import <Foundation/Foundation.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMobBannerView.h>

@implementation ABI43_0_0EXAdsAdMobBannerViewManager

ABI43_0_0EX_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI43_0_0EXAdsAdMobBannerView alloc] init];
}

ABI43_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI43_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI43_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI43_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI43_0_0EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI43_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

