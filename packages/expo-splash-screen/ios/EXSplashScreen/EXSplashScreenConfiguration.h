#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, SplashScreenImageResizeMode) {
  SplashScreenImageResizeModeContain,
  SplashScreenImageResizeModeCover,
};

NS_ASSUME_NONNULL_BEGIN

@interface EXSplashScreenConfiguration : NSObject

@property (strong, nonatomic, nonnull, readonly) UIColor *backgroundColor;
@property (strong, nonatomic, nullable, readonly) NSString *imageUrl;
@property (nonatomic, readonly) SplashScreenImageResizeMode imageResizeMode;
 
- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithBackgroundColor:(UIColor *)backgroundColor
                               imageUrl:(NSString * _Nullable)imageUrl
                        imageResizeMode:(SplashScreenImageResizeMode)imageResizeMode;

@end

NS_ASSUME_NONNULL_END
