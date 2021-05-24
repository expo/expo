#import <Foundation/Foundation.h>
#import "EXManagedAppSplashScreenConfiguration.h"
#import <EXUpdates/EXUpdatesRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Parses manifest and builds SplashScreenConfiguration.
 */
@interface EXManagedAppSplashScreenConfigurationBuilder : NSObject

+ (EXManagedAppSplashScreenConfiguration *)parseManifest:(EXUpdatesRawManifest *)manifest;

@end

NS_ASSUME_NONNULL_END
