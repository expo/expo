#import "ABI44_0_0REATransition.h"

@interface ABI44_0_0REATransitionGroup : ABI44_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI44_0_0REAVisibilityTransition : ABI44_0_0REATransition
@property (nonatomic) ABI44_0_0REATransitionAnimationType animationType;
- (ABI44_0_0REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (ABI44_0_0REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI44_0_0REAInTransition : ABI44_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI44_0_0REAOutTransition : ABI44_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI44_0_0REAChangeTransition : ABI44_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
