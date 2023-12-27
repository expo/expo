#import <ABI42_0_0EXAdsFacebook/ABI42_0_0EXBannerViewManager.h>
#import <ABI42_0_0EXAdsFacebook/ABI42_0_0EXBannerView.h>

@implementation ABI42_0_0EXBannerViewManager

ABI42_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI42_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI42_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI42_0_0EXBannerView)
{
  [view setSize:value];
}

ABI42_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI42_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
