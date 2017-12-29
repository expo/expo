#import "ABI23_0_0EXBannerViewManager.h"
#import "ABI23_0_0EXBannerView.h"
#import "ABI23_0_0EXFacebook.h"

@implementation ABI23_0_0EXBannerViewManager

ABI23_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI23_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI23_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI23_0_0EXBannerView new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI23_0_0RCTBubblingEventBlock)

@end
