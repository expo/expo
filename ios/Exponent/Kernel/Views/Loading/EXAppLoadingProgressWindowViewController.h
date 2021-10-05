#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This is a simple UIViewController, but aware of the current screen orientation restrictions
 * implied by the currently visible app. AppLoadingProgressWindow is being presented above the
 * main application window and thus it's root UIViewController is managing the StatusBar rotation
 * while presented.
 */
@interface EXAppLoadingProgressWindowViewController : UIViewController

@end

NS_ASSUME_NONNULL_END
