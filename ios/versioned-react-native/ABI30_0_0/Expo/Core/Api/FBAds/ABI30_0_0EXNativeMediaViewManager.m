#import "ABI30_0_0EXNativeMediaViewManager.h"

@implementation ABI30_0_0EXNativeMediaViewManager

ABI30_0_0RCT_EXPORT_MODULE(MediaViewManager)

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
