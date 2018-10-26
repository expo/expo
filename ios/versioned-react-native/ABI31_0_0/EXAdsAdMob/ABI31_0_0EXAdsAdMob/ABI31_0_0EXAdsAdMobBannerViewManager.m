#import <Foundation/Foundation.h>
#import <ABI31_0_0EXAdsAdMob/ABI31_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI31_0_0EXAdsAdMob/ABI31_0_0EXAdsAdMobBannerView.h>

@implementation ABI31_0_0EXAdsAdMobBannerViewManager

ABI31_0_0EX_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI31_0_0EXAdsAdMobBannerView alloc] init];
}

ABI31_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI31_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI31_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI31_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI31_0_0EX_VIEW_PROPERTY(testDeviceID, NSString *, ABI31_0_0EXAdsAdMobBannerView)
{
  [view setTestDeviceID:value];
}

@end

