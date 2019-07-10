#import <ABI34_0_0EXAdsFacebook/ABI34_0_0EXBannerViewManager.h>
#import <ABI34_0_0EXAdsFacebook/ABI34_0_0EXBannerView.h>
#import <ABI34_0_0EXAdsFacebook/ABI34_0_0EXFacebookAdHelper.h>

@implementation ABI34_0_0EXBannerViewManager

ABI34_0_0UM_EXPORT_MODULE(CTKBannerViewManager)

- (UIView *)view
{
  if (![ABI34_0_0EXFacebookAdHelper facebookAppIdFromNSBundle]) {
    ABI34_0_0UMLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  return [ABI34_0_0EXBannerView new];
}

- (NSString *)viewName
{
  return @"CTKBannerView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAdPress", @"onAdError"];
}

ABI34_0_0UM_VIEW_PROPERTY(size, NSNumber *, ABI34_0_0EXBannerView)
{
  [view setSize:value];
}

ABI34_0_0UM_VIEW_PROPERTY(placementId, NSString *, ABI34_0_0EXBannerView)
{
  [view setPlacementId:value];
}

@end
