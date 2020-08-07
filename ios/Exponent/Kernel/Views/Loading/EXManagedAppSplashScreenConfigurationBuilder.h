#import <Foundation/Foundation.h>
#import <EXSplashScreen/EXSplashScreenConfiguration.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Parses manifest and builds SplashScreenConfiguration.
 */
@interface EXManagedAppSplashScreenConfigurationBuilder : NSObject

+ (EXSplashScreenConfiguration *)parseManifest:(NSDictionary *)manifest;

@end

NS_ASSUME_NONNULL_END
