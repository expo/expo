#import "EXNativeMediaViewManager.h"

@implementation EXNativeMediaViewManager

RCT_EXPORT_MODULE(MediaViewManager)

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
