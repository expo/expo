#import <ABI40_0_0EXAdsFacebook/ABI40_0_0EXAdIconViewManager.h>

@implementation ABI40_0_0EXAdIconViewManager

ABI40_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
