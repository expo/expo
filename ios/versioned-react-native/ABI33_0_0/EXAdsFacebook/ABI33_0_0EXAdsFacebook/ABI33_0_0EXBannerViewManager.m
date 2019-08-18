#import "ABI33_0_0EXBannerViewManager.h"
#import "ABI33_0_0EXBannerView.h"
#import "ABI33_0_0EXFacebookAdHelper.h"

@implementation ABI33_0_0EXBannerViewManager

ABI33_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  if (![ABI33_0_0EXFacebookAdHelper facebookAppIdFromNSBundle]) {
    ABI33_0_0UMLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI33_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI33_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI33_0_0EXBannerView)
{
  [view setSize:value];
}

ABI33_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI33_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
