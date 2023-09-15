#import "EXDevelopmentHomeLoader.h"

@class EXManifestsManifest;

#pragma mark - private/internal methods in App Loader & App Fetchers

@interface EXDevelopmentHomeLoader (EXAppLoaderTests)

@property (nonatomic, readonly) EXAppFetcher * _Nullable appFetcher;

- (BOOL)_fetchBundleWithManifest:(EXManifestsManifest *)manifest;

@end
