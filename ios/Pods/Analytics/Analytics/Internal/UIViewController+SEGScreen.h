#import "SEGSerializableValue.h"

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>

@interface UIViewController (SEGScreen)

+ (void)seg_swizzleViewDidAppear;
+ (UIViewController *)seg_rootViewControllerFromView:(UIView *)view;

@end

#endif
