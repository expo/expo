#import "ABI24_0_0RNAdMobDFPManager.h"
#import "ABI24_0_0RNDFPBannerView.h"

#if __has_include(<ReactABI24_0_0/ABI24_0_0RCTBridge.h>)
#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#else
#import "ABI24_0_0RCTBridge.h"
#endif

@implementation ABI24_0_0RNAdMobDFPManager

ABI24_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI24_0_0RNDFPBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onAdmobDispatchAppEvent, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI24_0_0RCTBubblingEventBlock)

@end
