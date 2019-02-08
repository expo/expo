#import "EXBannerViewManager.h"
#import "EXBannerView.h"
#import "EXFacebookAdHelper.h"

@implementation EXBannerViewManager

EX_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  if (![EXFacebookAdHelper facebookAppIdFromNSBundle]) {
    EXLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
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

EX_VIEW_PROPERTY(size, NSNumber *, EXBannerView)
{
  [view setSize:value];
}

EX_VIEW_PROPERTY(placementId, NSString *, EXBannerView)
{
  [view setPlacementId:value];
}

@end
