#import "EXKernelAppRegistry.h"

@class EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

@protocol EXAppBrowserController <NSObject>

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord;
- (void)moveHomeToVisible;
- (void)reloadVisibleApp;
- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(EXManifestsManifest *)manifest;
- (BOOL)isNuxFinished;
- (void)setIsNuxFinished:(BOOL)isFinished;
- (void)appDidFinishLoadingSuccessfully:(EXKernelAppRecord *)appRecord;

/// Show loading overlay immediately when opening an app
- (void)showAppLoadingOverlay;
/// Hide loading overlay (called when app view controller appears or on cancel)
- (void)hideAppLoadingOverlay;

@end

NS_ASSUME_NONNULL_END
