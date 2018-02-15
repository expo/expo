#import "ABI26_0_0EXBannerViewManager.h"
#import "ABI26_0_0EXBannerView.h"
#import "ABI26_0_0EXFacebook.h"

@implementation ABI26_0_0EXBannerViewManager

ABI26_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI26_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI26_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI26_0_0EXBannerView new];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI26_0_0RCTBubblingEventBlock)

@end
