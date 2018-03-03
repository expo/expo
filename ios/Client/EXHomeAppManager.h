#import "EXReactAppManager.h"

FOUNDATION_EXPORT NSString *kEXHomeBundleResourceName;
FOUNDATION_EXPORT NSString *kEXHomeManifestResourceName;

@interface EXHomeAppManager : EXReactAppManager

+ (NSDictionary *)bundledHomeManifest;
- (void)getHistoryUrlForExperienceId:(NSString *)experienceId completion:(void (^)(NSString *))completion;
- (void)showQRReader;

@end
