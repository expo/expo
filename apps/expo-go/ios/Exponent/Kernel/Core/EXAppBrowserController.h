#import <UIKit/UIKit.h>
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
/// @param statusText Optional custom status text (e.g., "Opening lesson..."). Pass nil for default "Opening project..."
- (void)showAppLoadingOverlayWithStatusText:(nullable NSString *)statusText;
/// Show loading overlay with an optional icon image (shown instead of the spinner)
/// @param statusText Optional custom status text. Pass nil for default "Opening project..."
/// @param iconImage Optional icon to display instead of the loading spinner. When provided, the cancel button and internet advice are also hidden.
/// @param minimumDisplayDuration Minimum seconds the overlay should be visible. If hide is called before this, it waits for the remainder.
/// @param fixedDismissDelay Fixed extra delay always added when dismissing, regardless of elapsed time.
- (void)showAppLoadingOverlayWithStatusText:(nullable NSString *)statusText iconImage:(nullable UIImage *)iconImage dismissDelay:(NSTimeInterval)minimumDisplayDuration fixedDismissDelay:(NSTimeInterval)fixedDismissDelay;
/// Hide loading overlay (called when app view controller appears or on cancel)
- (void)hideAppLoadingOverlay;

@end

NS_ASSUME_NONNULL_END
