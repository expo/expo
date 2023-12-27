#import <RNReanimated/REAAnimationsManager.h>
#import <RNReanimated/REASnapshot.h>

@interface REASharedTransitionManager : NSObject

- (void)notifyAboutNewView:(REAUIView *)view;
- (void)notifyAboutViewLayout:(REAUIView *)view withViewFrame:(CGRect)frame;
- (void)viewsDidLayout;
- (void)finishSharedAnimation:(REAUIView *)view removeView:(BOOL)removeView;
- (void)setFindPrecedingViewTagForTransitionBlock:
    (REAFindPrecedingViewTagForTransitionBlock)findPrecedingViewTagForTransition;
- (void)setCancelAnimationBlock:(REACancelAnimationBlock)cancelAnimationBlock;
- (instancetype)initWithAnimationsManager:(REAAnimationsManager *)animationManager;
- (REAUIView *)getTransitioningView:(NSNumber *)tag;
- (NSDictionary *)prepareDataForWorklet:(NSMutableDictionary *)currentValues
                           targetValues:(NSMutableDictionary *)targetValues;
- (void)onScreenRemoval:(REAUIView *)screen stack:(REAUIView *)stack;

@end
