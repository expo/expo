#import <ABI35_0_0EXAdsFacebook/ABI35_0_0EXBannerViewManager.h>
#import <ABI35_0_0EXAdsFacebook/ABI35_0_0EXBannerView.h>
#import <ABI35_0_0EXAdsFacebook/ABI35_0_0EXFacebookAdHelper.h>

@implementation ABI35_0_0EXBannerViewManager

ABI35_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  return [ABI35_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI35_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI35_0_0EXBannerView)
{
  [view setSize:value];
}

ABI35_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI35_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
