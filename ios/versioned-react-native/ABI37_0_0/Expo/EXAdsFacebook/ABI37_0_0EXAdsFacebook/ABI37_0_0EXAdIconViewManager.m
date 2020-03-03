#import <ABI37_0_0EXAdsFacebook/ABI37_0_0EXAdIconViewManager.h>

@implementation ABI37_0_0EXAdIconViewManager

ABI37_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
