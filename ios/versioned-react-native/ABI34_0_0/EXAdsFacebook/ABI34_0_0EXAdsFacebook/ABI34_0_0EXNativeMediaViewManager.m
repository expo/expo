#import <ABI34_0_0EXAdsFacebook/ABI34_0_0EXNativeMediaViewManager.h>
#import <FBAudienceNetwork/FBMediaView.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI34_0_0EXNativeMediaViewManager

ABI34_0_0UM_EXPORT_MODULE(MediaViewManager)

- (NSString *)viewName
{
  return @"MediaView";
}

- (UIView *)view
{
  return [[FBMediaView alloc] init];
}

@end

NS_ASSUME_NONNULL_END
