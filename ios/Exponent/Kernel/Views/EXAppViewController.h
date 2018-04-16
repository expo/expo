
#import <UIKit/UIKit.h>

@class EXKernelAppRecord;

@interface EXAppViewController : UIViewController

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record;
- (void)refresh;
- (void)reloadFromCache;

/**
 *  Maybe displays an error to the user. Ignores it if RCTRedBox is already showing it.
 */
- (void)maybeShowError:(NSError *)error;

/**
 *  Settable by the app's screen orientation API via the orientation kernel service.
 */
- (void)setSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

- (void)appStateDidBecomeActive;
- (void)appStateDidBecomeInactive;

/**
 *  The underlying react view or loading view. We need to expose this for animation/transitions
 *  because react does weird stuff with layout that prevents us from operating on the superview.
 */
@property (nonatomic, strong) UIView *contentView;

@end
