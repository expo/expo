#import "ABI41_0_0REATransition.h"

@interface ABI41_0_0REATransitionGroup : ABI41_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI41_0_0REAVisibilityTransition : ABI41_0_0REATransition
@property (nonatomic) ABI41_0_0REATransitionAnimationType animationType;
- (ABI41_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI41_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI41_0_0REAInTransition : ABI41_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI41_0_0REAOutTransition : ABI41_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI41_0_0REAChangeTransition : ABI41_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
