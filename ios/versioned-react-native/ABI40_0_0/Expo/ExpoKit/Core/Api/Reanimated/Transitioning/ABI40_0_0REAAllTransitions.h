#import "ABI40_0_0REATransition.h"

@interface ABI40_0_0REATransitionGroup : ABI40_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI40_0_0REAVisibilityTransition : ABI40_0_0REATransition
@property (nonatomic) ABI40_0_0REATransitionAnimationType animationType;
- (ABI40_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI40_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI40_0_0REAInTransition : ABI40_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI40_0_0REAOutTransition : ABI40_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI40_0_0REAChangeTransition : ABI40_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
