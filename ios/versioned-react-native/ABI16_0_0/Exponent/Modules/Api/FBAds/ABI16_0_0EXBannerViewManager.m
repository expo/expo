#import "ABI16_0_0EXBannerViewManager.h"
#import "ABI16_0_0EXBannerView.h"

@implementation ABI16_0_0EXBannerViewManager

ABI16_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [ABI16_0_0EXBannerView new];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI16_0_0RCTBubblingEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI16_0_0RCTBubblingEventBlock)

@end
