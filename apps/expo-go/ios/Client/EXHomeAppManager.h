#import "EXReactAppManager.h"

@class EXManifestAndAssetRequestHeaders;

@interface EXHomeAppManager : EXReactAppManager

#pragma mark - interfacing with home JS

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(EXManifestsManifest *)manifest;
- (void)getHistoryUrlForScopeKey:(NSString *)scopeKey completion:(void (^)(NSString *))completion;
- (void)showQRReader;
- (void)dispatchForegroundHomeEvent;

@end
