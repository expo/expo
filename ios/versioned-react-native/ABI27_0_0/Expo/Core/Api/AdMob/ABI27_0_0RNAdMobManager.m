#import "ABI27_0_0RNAdMobManager.h"
#import "ABI27_0_0RNBannerView.h"

#if __has_include(<ReactABI27_0_0/ABI27_0_0RCTBridge.h>)
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#else
#import "ABI27_0_0RCTBridge.h"
#endif

@implementation ABI27_0_0RNAdMobManager

ABI27_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI27_0_0RNBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI27_0_0RCTBubblingEventBlock)

@end
