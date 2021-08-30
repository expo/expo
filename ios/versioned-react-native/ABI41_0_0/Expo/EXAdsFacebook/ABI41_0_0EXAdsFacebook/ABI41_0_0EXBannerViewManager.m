#import <ABI41_0_0EXAdsFacebook/ABI41_0_0EXBannerViewManager.h>
#import <ABI41_0_0EXAdsFacebook/ABI41_0_0EXBannerView.h>

@implementation ABI41_0_0EXBannerViewManager

ABI41_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI41_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI41_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI41_0_0EXBannerView)
{
  [view setSize:value];
}

ABI41_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI41_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
