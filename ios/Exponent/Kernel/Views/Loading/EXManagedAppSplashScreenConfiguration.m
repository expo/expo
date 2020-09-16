#import "EXManagedAppSplashScreenConfiguration.h"

@implementation EXManagedAppSplashScreenConfiguration

- (instancetype)initWithBackgroundColor:(UIColor *)backgroundColor
                               imageUrl:(NSString *)imageUrl
                        imageResizeMode:(EXSplashScreenImageResizeMode)imageResizeMode
{
  if (self = [super init]) {
    _backgroundColor = backgroundColor;
    _imageUrl = imageUrl;
    _imageResizeMode = imageResizeMode;
  }
  return self;
}

@end
