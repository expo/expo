#import "ABI29_0_0EXAdIconViewManager.h"

@implementation ABI29_0_0EXAdIconViewManager

ABI29_0_0RCT_EXPORT_MODULE(AdIconViewManager)

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
