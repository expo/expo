#import <ABI39_0_0EXAdsFacebook/ABI39_0_0EXAdIconViewManager.h>

@implementation ABI39_0_0EXAdIconViewManager

ABI39_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
