#import "ABI45_0_0RNSScreen.h"

@interface ABI45_0_0RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
+ (BOOL)isCustomAnimation:(ABI45_0_0RNSScreenStackAnimation)animation;

@end
