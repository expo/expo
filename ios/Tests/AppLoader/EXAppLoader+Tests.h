#import "EXAppLoader.h"
#import <EXUpdates/EXUpdatesRawManifest.h>

#pragma mark - private/internal methods in App Loader & App Fetchers

@interface EXAppLoader (EXAppLoaderTests)

@property (nonatomic, readonly) EXAppFetcher * _Nullable appFetcher;

- (BOOL)_fetchBundleWithManifest:(EXUpdatesRawManifest *)manifest;

@end
