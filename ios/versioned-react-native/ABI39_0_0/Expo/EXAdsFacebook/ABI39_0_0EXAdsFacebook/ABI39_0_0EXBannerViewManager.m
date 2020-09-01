#import <ABI39_0_0EXAdsFacebook/ABI39_0_0EXBannerViewManager.h>
#import <ABI39_0_0EXAdsFacebook/ABI39_0_0EXBannerView.h>

@implementation ABI39_0_0EXBannerViewManager

ABI39_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI39_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI39_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI39_0_0EXBannerView)
{
  [view setSize:value];
}

ABI39_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI39_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
