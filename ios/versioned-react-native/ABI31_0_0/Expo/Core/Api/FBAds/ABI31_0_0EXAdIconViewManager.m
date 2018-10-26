#import "ABI31_0_0EXAdIconViewManager.h"

@implementation ABI31_0_0EXAdIconViewManager

ABI31_0_0RCT_EXPORT_MODULE(AdIconViewManager)

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
