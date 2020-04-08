#import "ABI37_0_0REATransition.h"

@interface ABI37_0_0REATransitionGroup : ABI37_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI37_0_0REAVisibilityTransition : ABI37_0_0REATransition
@property (nonatomic) ABI37_0_0REATransitionAnimationType animationType;
- (ABI37_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI37_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI37_0_0REAInTransition : ABI37_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI37_0_0REAOutTransition : ABI37_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI37_0_0REAChangeTransition : ABI37_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
