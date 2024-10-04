
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
 * TODO: temporary solution, see https://github.com/expo/expo/pull/10450
 * Hides the LoadingProgressWindow.
 */
- (void)hideLoadingProgressWindow;

- (void)appStateDidBecomeActive;
- (void)appStateDidBecomeInactive;

/**
 *  Backgrounds all descendant controllers (modals) presented by this controller.
 */
- (void)backgroundControllers;

/**
 *  Restores backgrounded controllers.
 */
- (void)foregroundControllers;

/**
 *  The underlying react view or loading view. We need to expose this for animation/transitions
 *  because react does weird stuff with layout that prevents us from operating on the superview.
 */
@property (nonatomic, strong) UIView *contentView;

@end

extern NSString *const kEXLastFatalErrorDateDefaultsKey;
