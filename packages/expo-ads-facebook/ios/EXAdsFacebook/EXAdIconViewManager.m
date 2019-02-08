#import <EXAdsFacebook/EXAdIconViewManager.h>

@implementation EXAdIconViewManager

EX_EXPORT_MODULE(AdIconViewManager)

- (NSString *)viewName
{
  return @"AdIconView";
}

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
