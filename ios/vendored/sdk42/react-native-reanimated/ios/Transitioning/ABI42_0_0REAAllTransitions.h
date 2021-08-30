#import "ABI42_0_0REATransition.h"

@interface ABI42_0_0REATransitionGroup : ABI42_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI42_0_0REAVisibilityTransition : ABI42_0_0REATransition
@property (nonatomic) ABI42_0_0REATransitionAnimationType animationType;
- (ABI42_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI42_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI42_0_0REAInTransition : ABI42_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI42_0_0REAOutTransition : ABI42_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI42_0_0REAChangeTransition : ABI42_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
