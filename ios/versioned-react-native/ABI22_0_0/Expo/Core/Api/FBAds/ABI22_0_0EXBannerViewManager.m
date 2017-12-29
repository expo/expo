#import "ABI22_0_0EXBannerViewManager.h"
#import "ABI22_0_0EXBannerView.h"
#import "ABI22_0_0EXFacebook.h"

@implementation ABI22_0_0EXBannerViewManager

ABI22_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI22_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI22_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI22_0_0EXBannerView new];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI22_0_0RCTBubblingEventBlock)

@end
