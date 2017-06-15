#import "ABI18_0_0EXBannerViewManager.h"
#import "ABI18_0_0EXBannerView.h"

@implementation ABI18_0_0EXBannerViewManager

ABI18_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [ABI18_0_0EXBannerView new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI18_0_0RCTBubblingEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI18_0_0RCTBubblingEventBlock)

@end
