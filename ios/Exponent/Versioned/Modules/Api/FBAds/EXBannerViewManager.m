#import "EXBannerViewManager.h"
#import "EXBannerView.h"

@implementation EXBannerViewManager

RCT_EXPORT_MODULE(CTKBannerViewManager)

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [EXBannerView new];
}

RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(placementId, NSString)
RCT_EXPORT_VIEW_PROPERTY(onAdPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAdError, RCTBubblingEventBlock)

@end
