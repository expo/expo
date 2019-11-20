#import <Foundation/Foundation.h>
#import <ABI35_0_0EXAdsAdMob/ABI35_0_0EXAdsAdMobBannerViewManager.h>
#import <ABI35_0_0EXAdsAdMob/ABI35_0_0EXAdsAdMobBannerView.h>

@implementation ABI35_0_0EXAdsAdMobBannerViewManager

ABI35_0_0UM_EXPORT_MODULE(ExpoAdsAdMobBannerView);

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
  return [[ABI35_0_0EXAdsAdMobBannerView alloc] init];
}

ABI35_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI35_0_0EXAdsAdMobBannerView)
{
  [view setBannerSize:value];
}

ABI35_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI35_0_0EXAdsAdMobBannerView)
{
  [view setAdUnitID:value];
}

ABI35_0_0UM_VIEW_PROPERTY(testDeviceID, NSString *, ABI35_0_0EXAdsAdMobBannerView)
{
  [view setTestDeviceID:value];
}

ABI35_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI35_0_0EXAdsAdMobBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end

