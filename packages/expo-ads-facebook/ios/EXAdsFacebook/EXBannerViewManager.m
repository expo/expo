#import "EXBannerViewManager.h"
#import "EXBannerView.h"
#import "EXFacebookAdHelper.h"

@implementation EXBannerViewManager

UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  if (![EXFacebookAdHelper facebookAppIdFromNSBundle]) {
    UMLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

UM_VIEW_PROPERTY(size, NSNumber *, EXBannerView)
{
  [view setSize:value];
}

UM_VIEW_PROPERTY(placementId, NSString *, EXBannerView)
{
  [view setPlacementId:value];
}

@end
