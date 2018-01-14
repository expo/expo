#import "ABI25_0_0RNAdMobManager.h"
#import "ABI25_0_0RNBannerView.h"

#if __has_include(<ReactABI25_0_0/ABI25_0_0RCTBridge.h>)
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#else
#import "ABI25_0_0RCTBridge.h"
#endif

@implementation ABI25_0_0RNAdMobManager

ABI25_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI25_0_0RNBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI25_0_0RCTBubblingEventBlock)

@end
