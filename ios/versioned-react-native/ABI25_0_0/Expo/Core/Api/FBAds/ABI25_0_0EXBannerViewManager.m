#import "ABI25_0_0EXBannerViewManager.h"
#import "ABI25_0_0EXBannerView.h"
#import "ABI25_0_0EXFacebook.h"

@implementation ABI25_0_0EXBannerViewManager

ABI25_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI25_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI25_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI25_0_0EXBannerView new];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI25_0_0RCTBubblingEventBlock)

@end
