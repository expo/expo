#import <ABI41_0_0EXAdsFacebook/ABI41_0_0EXAdIconViewManager.h>

@implementation ABI41_0_0EXAdIconViewManager

ABI41_0_0UM_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
