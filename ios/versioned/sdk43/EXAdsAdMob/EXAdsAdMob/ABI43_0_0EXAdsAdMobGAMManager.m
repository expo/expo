#import <Foundation/Foundation.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMobGAMManager.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsGAMBannerView.h>

@implementation ABI43_0_0EXAdsAdMobGAMManager

ABI43_0_0EX_EXPORT_MODULE(ExpoPublisherBannerView);

- (NSString *)viewName
{
  return @"ExpoAdsPublisherBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onAdmobDispatchAppEvent",
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
  return [[ABI43_0_0EXAdsGAMBannerView alloc] init];
}

ABI43_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI43_0_0EXAdsGAMBannerView)
{
  [view setBannerSize:value];
}

ABI43_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI43_0_0EXAdsGAMBannerView)
{
  [view setAdUnitID:value];
}

ABI43_0_0EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI43_0_0EXAdsGAMBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
