#import <ABI47_0_0RNReanimated/ABI47_0_0REATransition.h>

@interface ABI47_0_0REATransitionGroup : ABI47_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI47_0_0REAVisibilityTransition : ABI47_0_0REATransition
@property (nonatomic) ABI47_0_0REATransitionAnimationType animationType;
- (ABI47_0_0REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (ABI47_0_0REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI47_0_0REAInTransition : ABI47_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI47_0_0REAOutTransition : ABI47_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI47_0_0REAChangeTransition : ABI47_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
