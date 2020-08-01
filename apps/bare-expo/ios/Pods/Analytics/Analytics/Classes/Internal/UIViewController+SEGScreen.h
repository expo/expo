#import <UIKit/UIKit.h>
#import "SEGSerializableValue.h"

@interface UIViewController (SEGScreen)

+ (void)seg_swizzleViewDidAppear;
+ (UIViewController *)seg_topViewController;

@end

