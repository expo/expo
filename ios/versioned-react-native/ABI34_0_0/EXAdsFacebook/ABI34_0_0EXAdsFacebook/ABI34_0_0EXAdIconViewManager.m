#import <ABI34_0_0EXAdsFacebook/ABI34_0_0EXAdIconViewManager.h>

@implementation ABI34_0_0EXAdIconViewManager

ABI34_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
