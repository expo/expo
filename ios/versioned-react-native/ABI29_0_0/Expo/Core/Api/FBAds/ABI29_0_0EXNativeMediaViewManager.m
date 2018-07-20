#import "ABI29_0_0EXNativeMediaViewManager.h"

@implementation ABI29_0_0EXNativeMediaViewManager

ABI29_0_0RCT_EXPORT_MODULE(MediaViewManager)

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
