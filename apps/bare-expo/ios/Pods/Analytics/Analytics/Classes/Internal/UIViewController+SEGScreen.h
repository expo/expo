#import <UIKit/UIKit.h>


@interface UIViewController (SEGScreen)

+ (void)seg_swizzleViewDidAppear;
+ (UIViewController *)seg_topViewController;

@end
