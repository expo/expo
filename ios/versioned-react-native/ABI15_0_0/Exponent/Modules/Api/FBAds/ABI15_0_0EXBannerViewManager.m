#import "ABI15_0_0EXBannerViewManager.h"
#import "ABI15_0_0EXBannerView.h"

@implementation ABI15_0_0EXBannerViewManager

ABI15_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [ABI15_0_0EXBannerView new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI15_0_0RCTBubblingEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI15_0_0RCTBubblingEventBlock)

@end
