#import <ABI43_0_0EXAdsFacebook/ABI43_0_0EXAdIconViewManager.h>

@implementation ABI43_0_0EXAdIconViewManager

ABI43_0_0EX_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
