#import <EXAdsFacebook/EXBannerViewManager.h>
#import <EXAdsFacebook/EXBannerView.h>

@implementation EXBannerViewManager

EX_EXPORT_MODULE(CTKBannerViewManager)

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

EX_VIEW_PROPERTY(size, NSNumber *, EXBannerView)
{
  [view setSize:value];
}

EX_VIEW_PROPERTY(placementId, NSString *, EXBannerView)
{
  [view setPlacementId:value];
}

@end
