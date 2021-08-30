#import "EXKernelAppRegistry.h"
#import <EXManifests/EXManifestsManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXAppBrowserController <NSObject>

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord;
- (void)moveHomeToVisible;
- (void)reloadVisibleApp;
- (void)showQRReader;
- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(EXManifestsManifest *)manifest;
- (void)getHistoryUrlForScopeKey:(NSString *)scopeKey completion:(void (^)(NSString * _Nullable))completion;
- (BOOL)isNuxFinished;
- (void)setIsNuxFinished:(BOOL)isFinished;
- (void)appDidFinishLoadingSuccessfully:(EXKernelAppRecord *)appRecord;

@end

NS_ASSUME_NONNULL_END
