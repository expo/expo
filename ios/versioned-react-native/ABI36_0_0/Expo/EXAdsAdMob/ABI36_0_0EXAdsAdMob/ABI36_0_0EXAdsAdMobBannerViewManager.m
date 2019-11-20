#import <Foundation/Foundation.h>
#import <ABI36_0_0EXAdsAdMob/ABI36_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI36_0_0EXAdsAdMob/ABI36_0_0EXAdsAdMobBannerView.h>

@implementation ABI36_0_0EXAdsAdMobBannerViewManager

ABI36_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI36_0_0EXAdsAdMobBannerView alloc] init];
}

ABI36_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI36_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI36_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI36_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI36_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI36_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

