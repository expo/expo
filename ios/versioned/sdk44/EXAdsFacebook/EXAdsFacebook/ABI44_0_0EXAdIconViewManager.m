#import <ABI44_0_0EXAdsFacebook/ABI44_0_0EXAdIconViewManager.h>

@implementation ABI44_0_0EXAdIconViewManager

ABI44_0_0EX_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
