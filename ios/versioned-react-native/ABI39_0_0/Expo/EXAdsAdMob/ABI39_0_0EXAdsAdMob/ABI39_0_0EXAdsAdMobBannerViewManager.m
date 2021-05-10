#import <Foundation/Foundation.h>
#import <ABI39_0_0EXAdsAdMob/ABI39_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI39_0_0EXAdsAdMob/ABI39_0_0EXAdsAdMobBannerView.h>

@implementation ABI39_0_0EXAdsAdMobBannerViewManager

ABI39_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI39_0_0EXAdsAdMobBannerView alloc] init];
}

ABI39_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI39_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI39_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI39_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI39_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI39_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

