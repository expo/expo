#import "ABI21_0_0RNAdMobManager.h"
#import "ABI21_0_0RNBannerView.h"

#if __has_include(<ReactABI21_0_0/ABI21_0_0RCTBridge.h>)
#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#else
#import "ABI21_0_0RCTBridge.h"
#endif

@implementation ABI21_0_0RNAdMobManager

ABI21_0_0RCT_EXPORT_MODULE();

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI21_0_0RNBannerView alloc] init];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(bannerSize, NSString);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(adUnitID, NSString);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(testDeviceID, NSString);

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onSizeChange, ABI21_0_0RCTBubblingEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidReceiveAd, ABI21_0_0RCTBubblingEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onDidFailToReceiveAdWithError, ABI21_0_0RCTBubblingEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillPresentScreen, ABI21_0_0RCTBubblingEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillDismissScreen, ABI21_0_0RCTBubblingEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewDidDismissScreen, ABI21_0_0RCTBubblingEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onAdViewWillLeaveApplication, ABI21_0_0RCTBubblingEventBlock)

@end
