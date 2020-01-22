#import <Foundation/Foundation.h>
#import <ABI33_0_0EXAdsAdMob/ABI33_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI33_0_0EXAdsAdMob/ABI33_0_0EXAdsAdMobBannerView.h>

@implementation ABI33_0_0EXAdsAdMobBannerViewManager

ABI33_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI33_0_0EXAdsAdMobBannerView alloc] init];
}

ABI33_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI33_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI33_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI33_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI33_0_0UM_VIEW_PROPERTY(testDeviceID, NSString *, ABI33_0_0EXAdsAdMobBannerView)
{
  [view setTestDeviceID:value];
}

@end

