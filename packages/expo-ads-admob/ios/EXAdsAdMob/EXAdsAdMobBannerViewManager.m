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

EX_VIEW_PROPERTY(testDeviceID, NSString *, EXAdsAdMobBannerView)
{
  [view setTestDeviceID:value];
}

@end

