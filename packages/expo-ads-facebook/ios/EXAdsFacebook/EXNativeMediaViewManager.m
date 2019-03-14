#import <EXAdsFacebook/EXNativeMediaViewManager.h>

@implementation EXNativeMediaViewManager

UM_EXPORT_MODULE(MediaViewManager)

- (NSString *)viewName
{
  return @"MediaView";
}

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
