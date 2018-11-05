#import "ABI27_0_0EXBannerViewManager.h"
#import "ABI27_0_0EXBannerView.h"
#import "ABI27_0_0EXFacebook.h"

@implementation ABI27_0_0EXBannerViewManager

ABI27_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI27_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI27_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI27_0_0EXBannerView new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI27_0_0RCTBubblingEventBlock)

@end
