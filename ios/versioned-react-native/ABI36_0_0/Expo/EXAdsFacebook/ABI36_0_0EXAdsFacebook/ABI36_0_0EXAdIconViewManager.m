#import <ABI36_0_0EXAdsFacebook/ABI36_0_0EXAdIconViewManager.h>

@implementation ABI36_0_0EXAdIconViewManager

ABI36_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
