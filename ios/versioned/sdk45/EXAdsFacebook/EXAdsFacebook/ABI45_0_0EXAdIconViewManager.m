#import <ABI45_0_0EXAdsFacebook/ABI45_0_0EXAdIconViewManager.h>

@implementation ABI45_0_0EXAdIconViewManager

ABI45_0_0EX_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
