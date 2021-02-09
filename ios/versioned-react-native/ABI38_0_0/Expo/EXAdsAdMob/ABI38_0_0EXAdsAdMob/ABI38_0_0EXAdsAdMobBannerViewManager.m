#import <Foundation/Foundation.h>
#import <ABI38_0_0EXAdsAdMob/ABI38_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI38_0_0EXAdsAdMob/ABI38_0_0EXAdsAdMobBannerView.h>

@implementation ABI38_0_0EXAdsAdMobBannerViewManager

ABI38_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI38_0_0EXAdsAdMobBannerView alloc] init];
}

ABI38_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI38_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI38_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI38_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI38_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI38_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

