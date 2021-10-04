#import <ABI43_0_0EXAdsFacebook/ABI43_0_0EXBannerViewManager.h>
#import <ABI43_0_0EXAdsFacebook/ABI43_0_0EXBannerView.h>

@implementation ABI43_0_0EXBannerViewManager

ABI43_0_0EX_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI43_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI43_0_0EX_VIEW_PROPERTY(size, NSNumber *, ABI43_0_0EXBannerView)
{
  [view setSize:value];
}

ABI43_0_0EX_VIEW_PROPERTY(placementId, NSString *, ABI43_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
