
#import <UIKit/UIKit.h>

@class EXKernelAppRecord;

@interface EXAppViewController : UIViewController

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)record;
- (void)refresh;

@end
