#import "ABI28_0_0RNAdMobManager.h"
#import "ABI28_0_0RNBannerView.h"

#if __has_include(<ReactABI28_0_0/ABI28_0_0RCTBridge.h>)
#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#else
#import "ABI28_0_0RCTBridge.h"
#endif

@implementation ABI28_0_0RNAdMobManager

ABI28_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI28_0_0RNBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI28_0_0RCTBubblingEventBlock)

@end
