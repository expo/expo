#import <ABI38_0_0EXAdsFacebook/ABI38_0_0EXAdIconViewManager.h>

@implementation ABI38_0_0EXAdIconViewManager

ABI38_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
