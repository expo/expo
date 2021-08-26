#import <Foundation/Foundation.h>
#import "EXManagedAppSplashScreenConfiguration.h"
#import <EXRawManifests/EXRawManifestsRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Parses manifest and builds SplashScreenConfiguration.
 */
@interface EXManagedAppSplashScreenConfigurationBuilder : NSObject

+ (EXManagedAppSplashScreenConfiguration *)parseManifest:(EXRawManifestsRawManifest *)manifest;

@end

NS_ASSUME_NONNULL_END
