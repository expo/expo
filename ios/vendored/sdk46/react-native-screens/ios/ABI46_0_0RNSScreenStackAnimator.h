#import "ABI46_0_0RNSScreen.h"

@interface ABI46_0_0RNSScreenStackAnimator : NSObject <UIViewControllerAnimatedTransitioning>

- (instancetype)initWithOperation:(UINavigationControllerOperation)operation;
+ (BOOL)isCustomAnimation:(ABI46_0_0RNSScreenStackAnimation)animation;

@end
