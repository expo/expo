#import <Foundation/Foundation.h>
#import <EXSplashScreen/EXSplashScreenViewNativeProvider.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Home SplashScreen view is just a plain .storyboard file with one moving element (spinner).
 * This provides behaves exactly the same as a base class (provides a view from the native asset),
 * but additionally starts the spinning animation.
 */
@interface EXHomeAppSplashScreenViewProvider : EXSplashScreenViewNativeProvider

@end

NS_ASSUME_NONNULL_END
