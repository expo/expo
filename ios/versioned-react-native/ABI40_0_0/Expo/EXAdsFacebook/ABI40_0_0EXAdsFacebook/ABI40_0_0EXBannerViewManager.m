#import <ABI40_0_0EXAdsFacebook/ABI40_0_0EXBannerViewManager.h>
#import <ABI40_0_0EXAdsFacebook/ABI40_0_0EXBannerView.h>

@implementation ABI40_0_0EXBannerViewManager

ABI40_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI40_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI40_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI40_0_0EXBannerView)
{
  [view setSize:value];
}

ABI40_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI40_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
