#import "ABI49_0_0RNSScreen.h"

@interface ABI49_0_0RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
+ (BOOL)isCustomAnimation:(ABI49_0_0RNSScreenStackAnimation)animation;

@end
