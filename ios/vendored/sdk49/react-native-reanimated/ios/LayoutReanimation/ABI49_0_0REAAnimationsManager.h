#import <Foundation/Foundation.h>
#import <ABI49_0_0RNReanimated/LayoutAnimationType.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REANodesManager.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REASnapshot.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ViewState) {
  Inactive,
  Appearing,
  Disappearing,
  Layout,
  ToRemove,
};

typedef BOOL (^ABI49_0_0REAHasAnimationBlock)(NSNumber *_Nonnull tag, LayoutAnimationType type);
typedef void (^ABI49_0_0REAAnimationStartingBlock)(
    NSNumber *_Nonnull tag,
    LayoutAnimationType type,
    NSDictionary *_Nonnull yogaValues,
    NSNumber *_Nonnull depth);
typedef void (^ABI49_0_0REAAnimationRemovingBlock)(NSNumber *_Nonnull tag);
typedef void (
    ^ABI49_0_0REACancelAnimationBlock)(NSNumber *_Nonnull tag, LayoutAnimationType type, BOOL cancelled, BOOL removeView);
typedef NSNumber *_Nullable (^ABI49_0_0REAFindPrecedingViewTagForTransitionBlock)(NSNumber *_Nonnull tag);
typedef int (^ABI49_0_0REATreeVisitor)(id<ABI49_0_0RCTComponent>);

BOOL ABI49_0_0REANodeFind(id<ABI49_0_0RCTComponent> view, int (^block)(id<ABI49_0_0RCTComponent>));

@interface ABI49_0_0REAAnimationsManager : NSObject

- (instancetype)initWithUIManager:(ABI49_0_0RCTUIManager *)uiManager;
- (void)setAnimationStartingBlock:(ABI49_0_0REAAnimationStartingBlock)startAnimation;
- (void)setHasAnimationBlock:(ABI49_0_0REAHasAnimationBlock)hasAnimation;
- (void)setAnimationRemovingBlock:(ABI49_0_0REAAnimationRemovingBlock)clearAnimation;
- (void)progressLayoutAnimationWithStyle:(NSDictionary *_Nonnull)newStyle
                                  forTag:(NSNumber *_Nonnull)tag
                      isSharedTransition:(BOOL)isSharedTransition;
- (void)setFindPrecedingViewTagForTransitionBlock:
    (ABI49_0_0REAFindPrecedingViewTagForTransitionBlock)findPrecedingViewTagForTransition;
- (void)setCancelAnimationBlock:(ABI49_0_0REACancelAnimationBlock)animationCancellingBlock;
- (void)endLayoutAnimationForTag:(NSNumber *_Nonnull)tag cancelled:(BOOL)cancelled removeView:(BOOL)removeView;
- (void)endAnimationsRecursive:(UIView *)view;
- (void)invalidate;
- (void)viewDidMount:(UIView *)view withBeforeSnapshot:(ABI49_0_0REASnapshot *)snapshot withNewFrame:(CGRect)frame;
- (ABI49_0_0REASnapshot *)prepareSnapshotBeforeMountForView:(UIView *)view;
- (BOOL)wantsHandleRemovalOfView:(UIView *)view;
- (void)removeAnimationsFromSubtree:(UIView *)view;
- (void)reattachAnimatedChildren:(NSArray<id<ABI49_0_0RCTComponent>> *)children
                     toContainer:(id<ABI49_0_0RCTComponent>)container
                       atIndices:(NSArray<NSNumber *> *)indices;
- (void)onViewCreate:(UIView *)view after:(ABI49_0_0REASnapshot *)after;
- (void)onViewUpdate:(UIView *)view before:(ABI49_0_0REASnapshot *)before after:(ABI49_0_0REASnapshot *)after;
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
