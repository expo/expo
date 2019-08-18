#import "ABI32_0_0EXBannerViewManager.h"
#import "ABI32_0_0EXBannerView.h"
#import "ABI32_0_0EXFacebook.h"

@implementation ABI32_0_0EXBannerViewManager

ABI32_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI32_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI32_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI32_0_0EXBannerView new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI32_0_0RCTBubblingEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI32_0_0RCTBubblingEventBlock)

@end
