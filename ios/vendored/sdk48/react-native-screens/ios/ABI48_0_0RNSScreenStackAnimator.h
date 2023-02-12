#import "ABI48_0_0RNSScreen.h"

@interface ABI48_0_0RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
+ (BOOL)isCustomAnimation:(ABI48_0_0RNSScreenStackAnimation)animation;

@end
