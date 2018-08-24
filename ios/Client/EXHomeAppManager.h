#import "EXReactAppManager.h"

FOUNDATION_EXPORT NSString *kEXHomeBundleResourceName;
FOUNDATION_EXPORT NSString *kEXHomeManifestResourceName;

@interface EXHomeAppManager : EXReactAppManager

+ (NSDictionary *)bundledHomeManifest;

#pragma mark - interfacing with home JS

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(NSDictionary *)manifest;
- (void)getHistoryUrlForExperienceId:(NSString *)experienceId completion:(void (^)(NSString *))completion;
- (void)showQRReader;
- (void)getIsValidHomeManifestToOpen:(NSDictionary *)manifest manifestUrl:(NSURL *) manifestUrl completion:(void (^)(BOOL isValid))completion;

@end
