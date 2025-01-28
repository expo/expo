#import <UIKit/UIKit.h>
#import "EXSplashScreenViewProvider.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Provides a view for SplashScreen to be presented based on given configuration from the manifest.
 * Additionally it can reconfigure the view if manifest is changed during the app lifecycle
 * (you can provide an optimistic manifest at first and the actual manifest later on (e.g. when it's fetched from the network)).
 */
@interface EXManagedAppSplashScreenViewProvider : NSObject<EXSplashScreenViewProvider>

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithManifest:(EXManifestsManifest *)manifest;

/**
 * Triggers the view reconfiguration.
 */
- (void)updateSplashScreenViewWithManifest:(EXManifestsManifest *)manifest;

@end

NS_ASSUME_NONNULL_END
