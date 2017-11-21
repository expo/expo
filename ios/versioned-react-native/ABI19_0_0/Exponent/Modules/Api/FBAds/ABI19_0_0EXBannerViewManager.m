#import "ABI19_0_0EXBannerViewManager.h"
#import "ABI19_0_0EXBannerView.h"
#import "ABI19_0_0EXFacebook.h"

@implementation ABI19_0_0EXBannerViewManager

ABI19_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI19_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI19_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI19_0_0EXBannerView new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI19_0_0RCTBubblingEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI19_0_0RCTBubblingEventBlock)

@end
