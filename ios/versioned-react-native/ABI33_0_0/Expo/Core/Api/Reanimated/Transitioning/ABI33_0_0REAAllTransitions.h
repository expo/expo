#import "ABI33_0_0REATransition.h"

@interface ABI33_0_0REATransitionGroup : ABI33_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI33_0_0REAVisibilityTransition : ABI33_0_0REATransition
@property (nonatomic) ABI33_0_0REATransitionAnimationType animationType;
- (ABI33_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI33_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI33_0_0REAInTransition : ABI33_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI33_0_0REAOutTransition : ABI33_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI33_0_0REAChangeTransition : ABI33_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
