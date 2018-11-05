#import <Foundation/Foundation.h>
#import <EXAdsAdMob/EXAdsAdMobDFPManager.h>
#import <EXAdsAdMob/EXAdsDFPBannerView.h>

@implementation EXAdsAdMobDFPManager

EX_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[EXAdsDFPBannerView alloc] init];
}

EX_VIEW_PROPERTY(bannerSize, NSString *, EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

EX_VIEW_PROPERTY(adUnitID, NSString *, EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

EX_VIEW_PROPERTY(testDeviceID, NSString *, EXAdsDFPBannerView)
{
  [view setTestDeviceID:value];
}

@end
