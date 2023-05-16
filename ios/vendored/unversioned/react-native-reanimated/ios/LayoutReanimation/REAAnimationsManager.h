#import <Foundation/Foundation.h>
#import <RNReanimated/LayoutAnimationType.h>
#import <RNReanimated/REANodesManager.h>
#import <RNReanimated/REASnapshot.h>
#import <React/RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ViewState) {
  Inactive,
  Appearing,
  Disappearing,
  Layout,
  ToRemove,
};

typedef BOOL (^REAHasAnimationBlock)(NSNumber *_Nonnull tag, LayoutAnimationType type);
typedef void (^REAAnimationStartingBlock)(
    NSNumber *_Nonnull tag,
    LayoutAnimationType type,
    NSDictionary *_Nonnull yogaValues,
    NSNumber *_Nonnull depth);
typedef void (^REAAnimationRemovingBlock)(NSNumber *_Nonnull tag);
typedef void (
    ^REACancelAnimationBlock)(NSNumber *_Nonnull tag, LayoutAnimationType type, BOOL cancelled, BOOL removeView);
typedef NSNumber *_Nullable (^REAFindPrecedingViewTagForTransitionBlock)(NSNumber *_Nonnull tag);
typedef int (^REATreeVisitor)(id<RCTComponent>);

BOOL REANodeFind(id<RCTComponent> view, int (^block)(id<RCTComponent>));

@interface REAAnimationsManager : NSObject

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager;
- (void)setAnimationStartingBlock:(REAAnimationStartingBlock)startAnimation;
- (void)setHasAnimationBlock:(REAHasAnimationBlock)hasAnimation;
- (void)setAnimationRemovingBlock:(REAAnimationRemovingBlock)clearAnimation;
- (void)progressLayoutAnimationWithStyle:(NSDictionary *_Nonnull)newStyle
                                  forTag:(NSNumber *_Nonnull)tag
                      isSharedTransition:(BOOL)isSharedTransition;
- (void)setFindPrecedingViewTagForTransitionBlock:
    (REAFindPrecedingViewTagForTransitionBlock)findPrecedingViewTagForTransition;
- (void)setCancelAnimationBlock:(REACancelAnimationBlock)animationCancellingBlock;
- (void)endLayoutAnimationForTag:(NSNumber *_Nonnull)tag cancelled:(BOOL)cancelled removeView:(BOOL)removeView;
- (void)endAnimationsRecursive:(UIView *)view;
- (void)invalidate;
- (void)viewDidMount:(UIView *)view withBeforeSnapshot:(REASnapshot *)snapshot withNewFrame:(CGRect)frame;
- (REASnapshot *)prepareSnapshotBeforeMountForView:(UIView *)view;
- (BOOL)wantsHandleRemovalOfView:(UIView *)view;
- (void)removeAnimationsFromSubtree:(UIView *)view;
- (void)reattachAnimatedChildren:(NSArray<id<RCTComponent>> *)children
                     toContainer:(id<RCTComponent>)container
                       atIndices:(NSArray<NSNumber *> *)indices;
- (void)onViewCreate:(UIView *)view after:(REASnapshot *)after;
- (void)onViewUpdate:(UIView *)view before:(REASnapshot *)before after:(REASnapshot *)after;
- (void)viewsDidLayout;
- (NSDictionary *)prepareDataForLayoutAnimatingWorklet:(NSMutableDictionary *)currentValues
                                          targetValues:(NSMutableDictionary *)targetValues;
- (UIView *)viewForTag:(NSNumber *)tag;
- (BOOL)hasAnimationForTag:(NSNumber *)tag type:(LayoutAnimationType)type;
- (void)clearAnimationConfigForTag:(NSNumber *)tag;
- (void)startAnimationForTag:(NSNumber *)tag
                        type:(LayoutAnimationType)type
                  yogaValues:(NSDictionary *)yogaValues
                       depth:(NSNumber *)depth;

@end

NS_ASSUME_NONNULL_END
