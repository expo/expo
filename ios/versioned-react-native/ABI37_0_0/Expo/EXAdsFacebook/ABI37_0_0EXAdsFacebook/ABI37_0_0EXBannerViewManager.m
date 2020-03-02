#import <ABI37_0_0EXAdsFacebook/ABI37_0_0EXBannerViewManager.h>
#import <ABI37_0_0EXAdsFacebook/ABI37_0_0EXBannerView.h>

@implementation ABI37_0_0EXBannerViewManager

ABI37_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI37_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI37_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI37_0_0EXBannerView)
{
  [view setSize:value];
}

ABI37_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI37_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
