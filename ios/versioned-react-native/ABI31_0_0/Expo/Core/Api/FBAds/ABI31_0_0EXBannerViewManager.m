#import "ABI31_0_0EXBannerViewManager.h"
#import "ABI31_0_0EXBannerView.h"
#import "ABI31_0_0EXFacebook.h"

@implementation ABI31_0_0EXBannerViewManager

ABI31_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI31_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI31_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI31_0_0EXBannerView new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI31_0_0RCTBubblingEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI31_0_0RCTBubblingEventBlock)

@end
