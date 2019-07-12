#import "ABI31_0_0EXNativeMediaViewManager.h"

@implementation ABI31_0_0EXNativeMediaViewManager

ABI31_0_0RCT_EXPORT_MODULE(MediaViewManager)

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
