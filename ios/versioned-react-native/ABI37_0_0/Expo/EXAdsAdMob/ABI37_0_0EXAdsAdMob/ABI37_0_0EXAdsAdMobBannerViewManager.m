#import <Foundation/Foundation.h>
#import <ABI37_0_0EXAdsAdMob/ABI37_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI37_0_0EXAdsAdMob/ABI37_0_0EXAdsAdMobBannerView.h>

@implementation ABI37_0_0EXAdsAdMobBannerViewManager

ABI37_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI37_0_0EXAdsAdMobBannerView alloc] init];
}

ABI37_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI37_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI37_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI37_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI37_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI37_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

