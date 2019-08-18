#import <Foundation/Foundation.h>
#import <ABI32_0_0EXAdsAdMob/ABI32_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI32_0_0EXAdsAdMob/ABI32_0_0EXAdsAdMobBannerView.h>

@implementation ABI32_0_0EXAdsAdMobBannerViewManager

ABI32_0_0EX_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI32_0_0EXAdsAdMobBannerView alloc] init];
}

ABI32_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI32_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI32_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI32_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI32_0_0EX_VIEW_PROPERTY(testDeviceID, NSString *, ABI32_0_0EXAdsAdMobBannerView)
{
  [view setTestDeviceID:value];
}

@end

