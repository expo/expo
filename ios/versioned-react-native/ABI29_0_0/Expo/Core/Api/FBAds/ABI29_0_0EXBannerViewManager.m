#import "ABI29_0_0EXBannerViewManager.h"
#import "ABI29_0_0EXBannerView.h"
#import "ABI29_0_0EXFacebook.h"

@implementation ABI29_0_0EXBannerViewManager

ABI29_0_0RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![ABI29_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI29_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI29_0_0EXBannerView new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onAdPress, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onAdError, ABI29_0_0RCTBubblingEventBlock)

@end
