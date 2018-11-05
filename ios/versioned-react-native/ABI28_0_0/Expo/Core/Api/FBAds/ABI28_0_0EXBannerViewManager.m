#import "ABI28_0_0EXBannerViewManager.h"
#import "ABI28_0_0EXBannerView.h"
#import "ABI28_0_0EXFacebook.h"

@implementation ABI28_0_0EXBannerViewManager

ABI28_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI28_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI28_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI28_0_0EXBannerView new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI28_0_0RCTBubblingEventBlock)

@end
