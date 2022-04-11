#import <Foundation/Foundation.h>
#import <ABI44_0_0EXAdsAdMob/ABI44_0_0EXAdsAdMobGAMManager.h>
#import <ABI44_0_0EXAdsAdMob/ABI44_0_0EXAdsGAMBannerView.h>

@implementation ABI44_0_0EXAdsAdMobGAMManager

ABI44_0_0EX_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI44_0_0EXAdsGAMBannerView alloc] init];
}

ABI44_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI44_0_0EXAdsGAMBannerView)
{
  [view setBannerSize:value];
}

ABI44_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI44_0_0EXAdsGAMBannerView)
{
  [view setAdUnitID:value];
}

ABI44_0_0EX_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI44_0_0EXAdsGAMBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
