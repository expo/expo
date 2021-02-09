#import <Foundation/Foundation.h>
#import "EXManagedAppSplashScreenConfiguration.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Parses manifest and builds SplashScreenConfiguration.
 */
@interface EXManagedAppSplashScreenConfigurationBuilder : NSObject

+ (EXManagedAppSplashScreenConfiguration *)parseManifest:(NSDictionary *)manifest;

@end

NS_ASSUME_NONNULL_END
