#import <ABI45_0_0EXAdsFacebook/ABI45_0_0EXBannerViewManager.h>
#import <ABI45_0_0EXAdsFacebook/ABI45_0_0EXBannerView.h>

@implementation ABI45_0_0EXBannerViewManager

ABI45_0_0EX_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI45_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI45_0_0EX_VIEW_PROPERTY(size, NSNumber *, ABI45_0_0EXBannerView)
{
  [view setSize:value];
}

ABI45_0_0EX_VIEW_PROPERTY(placementId, NSString *, ABI45_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
