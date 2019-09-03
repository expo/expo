#import <ABI33_0_0EXAdsFacebook/ABI33_0_0EXAdIconViewManager.h>

@implementation ABI33_0_0EXAdIconViewManager

ABI33_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
