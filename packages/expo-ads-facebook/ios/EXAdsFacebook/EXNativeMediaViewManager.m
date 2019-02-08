#import <EXAdsFacebook/EXNativeMediaViewManager.h>

@implementation EXNativeMediaViewManager

EX_EXPORT_MODULE(MediaViewManager)

- (NSString *)viewName
{
  return @"MediaView";
}

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end
