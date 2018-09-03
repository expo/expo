#import <Foundation/Foundation.h>
#import <ABI30_0_0EXAdsAdMob/ABI30_0_0EXAdsAdMobDFPManager.h>
#import <ABI30_0_0EXAdsAdMob/ABI30_0_0EXAdsDFPBannerView.h>

@implementation ABI30_0_0EXAdsAdMobDFPManager

ABI30_0_0EX_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI30_0_0EXAdsDFPBannerView alloc] init];
}

ABI30_0_0EX_VIEW_PROPERTY(bannerSize, NSString *, ABI30_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI30_0_0EX_VIEW_PROPERTY(adUnitID, NSString *, ABI30_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI30_0_0EX_VIEW_PROPERTY(testDeviceID, NSString *, ABI30_0_0EXAdsDFPBannerView)
{
  [view setTestDeviceID:value];
}

@end
