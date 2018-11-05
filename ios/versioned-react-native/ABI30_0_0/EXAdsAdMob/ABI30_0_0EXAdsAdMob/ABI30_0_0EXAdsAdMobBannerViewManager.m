#import <Foundation/Foundation.h>
#import <ABI30_0_0EXAdsAdMob/ABI30_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI30_0_0EXAdsAdMob/ABI30_0_0EXAdsAdMobBannerView.h>

@implementation ABI30_0_0EXAdsAdMobBannerViewManager

ABI30_0_0EX_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI30_0_0EXAdsAdMobBannerView alloc] init];
}

ABI30_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI30_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI30_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI30_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI30_0_0EX_VIEW_PROPERTY(testDeviceID, NSString *, ABI30_0_0EXAdsAdMobBannerView)
{
  [view setTestDeviceID:value];
}

@end

