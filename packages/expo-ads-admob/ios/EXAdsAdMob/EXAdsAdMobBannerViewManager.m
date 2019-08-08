#import <Foundation/Foundation.h>
#import <EXAdsAdMob/EXAdsAdMobBannerViewManager.h>
#import <EXAdsAdMob/EXAdsAdMobBannerView.h>

@implementation EXAdsAdMobBannerViewManager

UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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

UM_VIEW_PROPERTY(bannerSize, NSString *, EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

UM_VIEW_PROPERTY(adUnitID, NSString *, EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

UM_VIEW_PROPERTY(testDeviceID, NSString *, EXAdsAdMobBannerView)
{
  [view setTestDeviceID:value];
}

@end

