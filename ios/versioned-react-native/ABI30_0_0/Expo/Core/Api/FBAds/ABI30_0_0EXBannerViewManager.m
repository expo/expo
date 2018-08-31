#import "ABI30_0_0EXBannerViewManager.h"
#import "ABI30_0_0EXBannerView.h"
#import "ABI30_0_0EXFacebook.h"

@implementation ABI30_0_0EXBannerViewManager

ABI30_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI30_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI30_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI30_0_0EXBannerView new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI30_0_0RCTBubblingEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI30_0_0RCTBubblingEventBlock)

@end
