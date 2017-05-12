#import "ABI17_0_0EXBannerViewManager.h"
#import "ABI17_0_0EXBannerView.h"

@implementation ABI17_0_0EXBannerViewManager

ABI17_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [ABI17_0_0EXBannerView new];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI17_0_0RCTBubblingEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI17_0_0RCTBubblingEventBlock)

@end
