#import <Foundation/Foundation.h>
#import <ABI45_0_0EXAdsAdMob/ABI45_0_0EXAdsAdMobGAMManager.h>
#import <ABI45_0_0EXAdsAdMob/ABI45_0_0EXAdsGAMBannerView.h>

@implementation ABI45_0_0EXAdsAdMobGAMManager

ABI45_0_0EX_EXPORT_MODULE(ExpoPublisherBannerView);

- (NSString *)viewName
{
  return @"ExpoAdsPublisherBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"onSizeChange",
    @"onAdmobDispatchAppEvent",
    @"onAdViewDidReceiveAd",
    @"onDidFailToReceiveAdWithError",
    @"onAdViewWillPresentScreen",
    @"onAdViewWillDismissScreen",
    @"onAdViewDidDismissScreen",
  ];
}

- (UIView *)view
{
  return [[ABI45_0_0EXAdsGAMBannerView alloc] init];
}

ABI45_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI45_0_0EXAdsGAMBannerView)
{
  [view setBannerSize:value];
}

ABI45_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI45_0_0EXAdsGAMBannerView)
{
  [view setAdUnitID:value];
}

ABI45_0_0EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI45_0_0EXAdsGAMBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
