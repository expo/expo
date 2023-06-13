#import "ABI47_0_0RNSScreen.h"

@interface ABI47_0_0RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
+ (BOOL)isCustomAnimation:(ABI47_0_0RNSScreenStackAnimation)animation;

@end
