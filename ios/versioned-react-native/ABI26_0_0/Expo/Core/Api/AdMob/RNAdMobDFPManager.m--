#import "ABI26_0_0RNAdMobDFPManager.h"
#import "ABI26_0_0RNDFPBannerView.h"

#if __has_include(<ReactABI26_0_0/ABI26_0_0RCTBridge.h>)
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#else
#import "ABI26_0_0RCTBridge.h"
#endif

@implementation ABI26_0_0RNAdMobDFPManager

ABI26_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI26_0_0RNDFPBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onAdmobDispatchAppEvent, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI26_0_0RCTBubblingEventBlock)

@end
