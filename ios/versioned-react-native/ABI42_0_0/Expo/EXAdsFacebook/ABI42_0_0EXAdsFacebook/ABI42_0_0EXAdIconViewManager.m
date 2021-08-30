#import <ABI42_0_0EXAdsFacebook/ABI42_0_0EXAdIconViewManager.h>

@implementation ABI42_0_0EXAdIconViewManager

ABI42_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
