#import "EXBannerViewManager.h"
#import "EXBannerView.h"
#import "EXFacebook.h"

@implementation EXBannerViewManager

RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  if (![EXFacebook facebookAppIdFromNSBundle]) {
    RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [EXBannerView new];
}

RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
RCT_EXPORT_VIEW_PROPERTY(onAdPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAdError, RCTBubblingEventBlock)

@end
