#import <Foundation/Foundation.h>
#import "EXManagedAppSplashScreenConfiguration.h"
#import <EXManifests/EXManifestsRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Parses manifest and builds SplashScreenConfiguration.
 */
@interface EXManagedAppSplashScreenConfigurationBuilder : NSObject

+ (EXManagedAppSplashScreenConfiguration *)parseManifest:(EXManifestsRawManifest *)manifest;

@end

NS_ASSUME_NONNULL_END
