#import <EXAdsFacebook/EXBannerViewManager.h>
#import <EXAdsFacebook/EXBannerView.h>

@implementation EXBannerViewManager

UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
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
