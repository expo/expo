#import "ABI20_0_0EXBannerViewManager.h"
#import "ABI20_0_0EXBannerView.h"
#import "ABI20_0_0EXFacebook.h"

@implementation ABI20_0_0EXBannerViewManager

ABI20_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI20_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI20_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI20_0_0EXBannerView new];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI20_0_0RCTBubblingEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI20_0_0RCTBubblingEventBlock)

@end
