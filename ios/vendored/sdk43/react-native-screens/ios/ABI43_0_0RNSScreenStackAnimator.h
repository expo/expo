#import "ABI43_0_0RNSScreen.h"

@interface ABI43_0_0RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
+ (BOOL)isCustomAnimation:(ABI43_0_0RNSScreenStackAnimation)animation;

@end
