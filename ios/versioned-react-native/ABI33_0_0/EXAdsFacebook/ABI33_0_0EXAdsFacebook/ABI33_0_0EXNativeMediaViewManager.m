#import <ABI33_0_0EXAdsFacebook/ABI33_0_0EXNativeMediaViewManager.h>

@implementation ABI33_0_0EXNativeMediaViewManager

ABI33_0_0UM_EXPORT_MODULE(MediaViewManager)

- (NSString *)viewName
{
  return @"MediaView";
}

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
