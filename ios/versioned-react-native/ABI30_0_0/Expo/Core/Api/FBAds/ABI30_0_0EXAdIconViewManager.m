#import "ABI30_0_0EXAdIconViewManager.h"

@implementation ABI30_0_0EXAdIconViewManager

ABI30_0_0RCT_EXPORT_MODULE(AdIconViewManager)

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
