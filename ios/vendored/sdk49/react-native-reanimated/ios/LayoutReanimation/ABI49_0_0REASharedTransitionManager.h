#import <ABI49_0_0RNReanimated/ABI49_0_0REAAnimationsManager.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REASnapshot.h>

@interface ABI49_0_0REASharedTransitionManager : NSObject

- (void)notifyAboutNewView:(UIView *)view;
- (void)notifyAboutViewLayout:(UIView *)view withViewFrame:(CGRect)frame;
- (void)viewsDidLayout;
- (BOOL)configureAndStartSharedTransitionForViews:(NSArray<UIView *> *)views;
- (void)finishSharedAnimation:(UIView *)view;
- (void)setFindPrecedingViewTagForTransitionBlock:
    (ABI49_0_0REAFindPrecedingViewTagForTransitionBlock)findPrecedingViewTagForTransition;
- (void)setCancelAnimationBlock:(ABI49_0_0REACancelAnimationBlock)cancelAnimationBlock;
- (instancetype)initWithAnimationsManager:(ABI49_0_0REAAnimationsManager *)animationManager;
- (UIView *)getTransitioningView:(NSNumber *)tag;

@end
