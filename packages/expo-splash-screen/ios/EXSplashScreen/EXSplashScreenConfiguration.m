#import <EXSplashScreen/EXSplashScreenConfiguration.h>

@implementation EXSplashScreenConfiguration

- (instancetype)initWithBackgroundColor:(UIColor *)backgroundColor
                               imageUrl:(NSString *)imageUrl
                        imageResizeMode:(SplashScreenImageResizeMode)imageResizeMode
{
  if (self = [super init]) {
    _backgroundColor = backgroundColor;
    _imageUrl = imageUrl;
    _imageResizeMode = imageResizeMode;
  }
  return self;
}

@end
