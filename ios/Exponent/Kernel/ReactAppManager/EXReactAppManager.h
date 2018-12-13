
#import <UIKit/UIKit.h>
#import "EXAppFetcher.h"
#import "EXKernelAppRecord.h"

typedef enum EXReactAppManagerStatus {
  kEXReactAppManagerStatusNew,
  kEXReactAppManagerStatusBridgeLoading,
  kEXReactAppManagerStatusRunning,
  kEXReactAppManagerStatusError,
} EXReactAppManagerStatus;

@protocol EXReactAppManagerUIDelegate <NSObject>

- (void)reactAppManagerIsReadyForLoad:(EXReactAppManager *)appManager;
- (void)reactAppManagerStartedLoadingJavaScript:(EXReactAppManager *)appManager;
- (void)reactAppManagerFinishedLoadingJavaScript:(EXReactAppManager *)appManager;
- (void)reactAppManager:(EXReactAppManager *)appManager failedToLoadJavaScriptWithError:(NSError *)error;
- (void)reactAppManagerDidInvalidate:(EXReactAppManager *)appManager;

@end

@interface EXReactAppManager : NSObject <EXAppFetcherDataSource>

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record initialProps:(NSDictionary *)initialProps;
- (void)rebuildBridge;
- (void)invalidate;

// these are piped in from the view controller when the app manager is waiting for a bundle.
- (void)appLoaderFinished;
- (void)appLoaderFailedWithError:(NSError *)error;

// these are piped in from the view controller when the app becomes visible or moves to background.
- (void)appStateDidBecomeActive;
- (void)appStateDidBecomeInactive;

@property (nonatomic, assign) BOOL isHeadless;
@property (nonatomic, readonly) BOOL isBridgeRunning;
@property (nonatomic, readonly) EXReactAppManagerStatus status;
@property (nonatomic, readonly) UIView *rootView;
@property (nonatomic, strong) id reactBridge;
@property (nonatomic, assign) id<EXReactAppManagerUIDelegate> delegate;
@property (nonatomic, weak) EXKernelAppRecord *appRecord;

#pragma mark - developer tools

- (BOOL)enablesDeveloperTools;
- (BOOL)requiresValidManifests;

/**
 * Call reload on existing bridge (developer-facing devtools reload)
 */
- (void)reloadBridge;

/**
 * Clear any executor class on the bridge and reload. Used by Cmd+N devtool key command.
 */
- (void)disableRemoteDebugging;
- (void)toggleElementInspector;
- (void)showDevMenu;

/**
 *  Enumerates items for the dev menu for this app
 */
- (NSDictionary<NSString *, NSString *> *)devMenuItems;
- (void)selectDevMenuItemWithKey:(NSString *)key;

@end
