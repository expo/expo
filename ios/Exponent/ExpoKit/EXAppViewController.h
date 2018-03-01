
#import <UIKit/UIKit.h>

@class EXKernelAppRecord;

@interface EXAppViewController : UIViewController

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record;
- (void)refresh;

/**
 *  Maybe displays an error to the user. Ignores it if RCTRedBox is already showing it.
 */
- (void)maybeShowError:(NSError *)error;

@end
