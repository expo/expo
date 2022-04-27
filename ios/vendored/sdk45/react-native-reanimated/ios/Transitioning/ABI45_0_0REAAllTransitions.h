#import <ABI45_0_0RNReanimated/ABI45_0_0REATransition.h>

@interface ABI45_0_0REATransitionGroup : ABI45_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI45_0_0REAVisibilityTransition : ABI45_0_0REATransition
@property (nonatomic) ABI45_0_0REATransitionAnimationType animationType;
- (ABI45_0_0REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (ABI45_0_0REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI45_0_0REAInTransition : ABI45_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI45_0_0REAOutTransition : ABI45_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI45_0_0REAChangeTransition : ABI45_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
