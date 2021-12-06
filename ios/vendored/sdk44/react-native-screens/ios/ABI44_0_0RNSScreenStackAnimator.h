#import "ABI44_0_0RNSScreen.h"

@interface ABI44_0_0RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
+ (BOOL)isCustomAnimation:(ABI44_0_0RNSScreenStackAnimation)animation;

@end
