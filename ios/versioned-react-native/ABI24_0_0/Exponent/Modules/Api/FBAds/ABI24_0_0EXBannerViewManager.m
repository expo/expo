#import "ABI24_0_0EXBannerViewManager.h"
#import "ABI24_0_0EXBannerView.h"
#import "ABI24_0_0EXFacebook.h"

@implementation ABI24_0_0EXBannerViewManager

ABI24_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI24_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI24_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI24_0_0EXBannerView new];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI24_0_0RCTBubblingEventBlock)

@end
