#import <ABI36_0_0EXAdsFacebook/ABI36_0_0EXBannerViewManager.h>
#import <ABI36_0_0EXAdsFacebook/ABI36_0_0EXBannerView.h>

@implementation ABI36_0_0EXBannerViewManager

ABI36_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI36_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI36_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI36_0_0EXBannerView)
{
  [view setSize:value];
}

ABI36_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI36_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
