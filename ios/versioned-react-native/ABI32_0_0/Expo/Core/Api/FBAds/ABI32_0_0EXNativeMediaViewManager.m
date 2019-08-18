#import "ABI32_0_0EXNativeMediaViewManager.h"

@implementation ABI32_0_0EXNativeMediaViewManager

ABI32_0_0RCT_EXPORT_MODULE(MediaViewManager)

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
