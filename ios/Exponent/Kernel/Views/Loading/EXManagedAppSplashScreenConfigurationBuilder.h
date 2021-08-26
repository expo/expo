#import <Foundation/Foundation.h>
#import "EXManagedAppSplashScreenConfiguration.h"
#import <EXManifests/EXManifestsManifest.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Parses manifest and builds SplashScreenConfiguration.
 */
@interface EXManagedAppSplashScreenConfigurationBuilder : NSObject

+ (EXManagedAppSplashScreenConfiguration *)parseManifest:(EXManifestsManifest *)manifest;

@end

NS_ASSUME_NONNULL_END
