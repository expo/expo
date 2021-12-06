#import <ABI44_0_0EXAdsFacebook/ABI44_0_0EXBannerViewManager.h>
#import <ABI44_0_0EXAdsFacebook/ABI44_0_0EXBannerView.h>

@implementation ABI44_0_0EXBannerViewManager

ABI44_0_0EX_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI44_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI44_0_0EX_VIEW_PROPERTY(size, NSNumber *, ABI44_0_0EXBannerView)
{
  [view setSize:value];
}

ABI44_0_0EX_VIEW_PROPERTY(placementId, NSString *, ABI44_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
