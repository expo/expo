#import <Foundation/Foundation.h>
#import <ABI44_0_0EXAdsAdMob/ABI44_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI44_0_0EXAdsAdMob/ABI44_0_0EXAdsAdMobBannerView.h>

@implementation ABI44_0_0EXAdsAdMobBannerViewManager

ABI44_0_0EX_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI44_0_0EXAdsAdMobBannerView alloc] init];
}

ABI44_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI44_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI44_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI44_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI44_0_0EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI44_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

