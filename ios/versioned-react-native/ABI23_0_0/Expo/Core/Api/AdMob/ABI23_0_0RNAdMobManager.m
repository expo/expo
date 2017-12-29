#import "ABI23_0_0RNAdMobManager.h"
#import "ABI23_0_0RNBannerView.h"

#if __has_include(<ReactABI23_0_0/ABI23_0_0RCTBridge.h>)
#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#else
#import "ABI23_0_0RCTBridge.h"
#endif

@implementation ABI23_0_0RNAdMobManager

ABI23_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI23_0_0RNBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI23_0_0RCTBubblingEventBlock)

@end
