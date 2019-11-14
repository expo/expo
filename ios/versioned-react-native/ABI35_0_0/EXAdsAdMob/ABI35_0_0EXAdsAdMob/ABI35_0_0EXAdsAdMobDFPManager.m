#import <Foundation/Foundation.h>
#import <ABI35_0_0EXAdsAdMob/ABI35_0_0EXAdsAdMobDFPManager.h>
#import <ABI35_0_0EXAdsAdMob/ABI35_0_0EXAdsDFPBannerView.h>

@implementation ABI35_0_0EXAdsAdMobDFPManager

ABI35_0_0UM_EXPORT_MODULE(ExpoPublisherBannerView);

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
  return [[ABI35_0_0EXAdsDFPBannerView alloc] init];
}

ABI35_0_0UM_VIEW_PROPERTY(bannerSize, NSString *, ABI35_0_0EXAdsDFPBannerView)
{
  [view setBannerSize:value];
}

ABI35_0_0UM_VIEW_PROPERTY(adUnitID, NSString *, ABI35_0_0EXAdsDFPBannerView)
{
  [view setAdUnitID:value];
}

ABI35_0_0UM_VIEW_PROPERTY(testDeviceID, NSString *, ABI35_0_0EXAdsDFPBannerView)
{
  [view setTestDeviceID:value];
}

ABI35_0_0UM_VIEW_PROPERTY(additionalRequestParams, NSDictionary *, ABI35_0_0EXAdsDFPBannerView)
{
  [view setAdditionalRequestParams:value];
}

@end
