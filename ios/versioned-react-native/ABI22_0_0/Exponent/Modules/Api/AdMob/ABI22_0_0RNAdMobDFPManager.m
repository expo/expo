#import "ABI22_0_0RNAdMobDFPManager.h"
#import "ABI22_0_0RNDFPBannerView.h"

#if __has_include(<ReactABI22_0_0/ABI22_0_0RCTBridge.h>)
#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#else
#import "ABI22_0_0RCTBridge.h"
#endif

@implementation ABI22_0_0RNAdMobDFPManager

ABI22_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI22_0_0RNDFPBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onAdmobDispatchAppEvent, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI22_0_0RCTBubblingEventBlock)

@end
