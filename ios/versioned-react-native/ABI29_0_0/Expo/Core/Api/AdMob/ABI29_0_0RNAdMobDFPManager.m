#import "ABI29_0_0RNAdMobDFPManager.h"
#import "ABI29_0_0RNDFPBannerView.h"

#if __has_include(<ReactABI29_0_0/ABI29_0_0RCTBridge.h>)
#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#else
#import "ABI29_0_0RCTBridge.h"
#endif

@implementation ABI29_0_0RNAdMobDFPManager

ABI29_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI29_0_0RNDFPBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onAdmobDispatchAppEvent, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI29_0_0RCTBubblingEventBlock)

@end
