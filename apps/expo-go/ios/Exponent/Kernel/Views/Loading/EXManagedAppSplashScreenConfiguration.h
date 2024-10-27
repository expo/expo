#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, EXSplashScreenImageResizeMode) {
  EXSplashScreenImageResizeModeContain,
  EXSplashScreenImageResizeModeCover,
};

NS_ASSUME_NONNULL_BEGIN

@interface EXManagedAppSplashScreenConfiguration : NSObject

@property (strong, nonatomic, nonnull, readonly) UIColor *backgroundColor;
@property (strong, nonatomic, nullable, readonly) NSString *imageUrl;
@property (nonatomic, readonly) EXSplashScreenImageResizeMode imageResizeMode;
 
- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithBackgroundColor:(UIColor *)backgroundColor
                               imageUrl:(NSString * _Nullable)imageUrl
                        imageResizeMode:(EXSplashScreenImageResizeMode)imageResizeMode;

@end

NS_ASSUME_NONNULL_END
