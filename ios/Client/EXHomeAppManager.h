#import "EXReactAppManager.h"
#import <EXRawManifests/EXRawManifestsRawManifest.h>

FOUNDATION_EXPORT NSString *kEXHomeBundleResourceName;
FOUNDATION_EXPORT NSString *kEXHomeManifestResourceName;

@interface EXHomeAppManager : EXReactAppManager

+ (EXRawManifestsRawManifest *)bundledHomeManifest;

#pragma mark - interfacing with home JS

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(EXRawManifestsRawManifest *)manifest;
- (void)getHistoryUrlForScopeKey:(NSString *)scopeKey completion:(void (^)(NSString *))completion;
- (void)showQRReader;

@end
