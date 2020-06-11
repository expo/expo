#import <ABI38_0_0EXAdsFacebook/ABI38_0_0EXBannerViewManager.h>
#import <ABI38_0_0EXAdsFacebook/ABI38_0_0EXBannerView.h>

@implementation ABI38_0_0EXBannerViewManager

ABI38_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI38_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI38_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI38_0_0EXBannerView)
{
  [view setSize:value];
}

ABI38_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI38_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
