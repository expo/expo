#import <ABI48_0_0RNReanimated/ABI48_0_0REATransition.h>

@interface ABI48_0_0REATransitionGroup : ABI48_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI48_0_0REAVisibilityTransition : ABI48_0_0REATransition
@property (nonatomic) ABI48_0_0REATransitionAnimationType animationType;
- (ABI48_0_0REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (ABI48_0_0REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI48_0_0REAInTransition : ABI48_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI48_0_0REAOutTransition : ABI48_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI48_0_0REAChangeTransition : ABI48_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
