#import "ABI32_0_0EXAdIconViewManager.h"

@implementation ABI32_0_0EXAdIconViewManager

ABI32_0_0RCT_EXPORT_MODULE(AdIconViewManager)

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
