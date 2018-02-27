
#import <UIKit/UIKit.h>
#import "EXKernelAppRecord.h"

typedef enum EXReactAppManagerStatus {
  kEXReactAppManagerStatusNew,
  kEXReactAppManagerStatusBridgeLoading,
  kEXReactAppManagerStatusRunning,
  kEXReactAppManagerStatusError,
} EXReactAppManagerStatus;

@protocol EXReactAppManagerUIDelegate <NSObject>

- (void)reactAppManagerIsReadyForDisplay:(EXReactAppManager *)appManager;
- (void)reactAppManagerDidInvalidate:(EXReactAppManager *)appManager;

@end

@interface EXReactAppManager : NSObject

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record;
- (void)reload;

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

@property (nonatomic, readonly) BOOL isBridgeRunning;
@property (nonatomic, readonly) EXReactAppManagerStatus status;
@property (nonatomic, readonly) UIView *rootView;
@property (nonatomic, strong) id reactBridge;
@property (nonatomic, assign) id<EXReactAppManagerUIDelegate> delegate;
@property (nonatomic, weak) EXKernelAppRecord *appRecord;

@end
