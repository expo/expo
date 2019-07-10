#import <Foundation/Foundation.h>
#import <ABI34_0_0EXAdsAdMob/ABI34_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI34_0_0EXAdsAdMob/ABI34_0_0EXAdsAdMobBannerView.h>

@implementation ABI34_0_0EXAdsAdMobBannerViewManager

ABI34_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI34_0_0EXAdsAdMobBannerView alloc] init];
}

ABI34_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI34_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI34_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI34_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI34_0_0UM_VIEW_PROPERTY(testDeviceID, NSString *, ABI34_0_0EXAdsAdMobBannerView)
{
  [view setTestDeviceID:value];
}

@end

