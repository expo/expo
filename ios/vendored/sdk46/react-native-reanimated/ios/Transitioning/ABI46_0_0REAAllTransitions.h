#import <ABI46_0_0RNReanimated/ABI46_0_0REATransition.h>

@interface ABI46_0_0REATransitionGroup : ABI46_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI46_0_0REAVisibilityTransition : ABI46_0_0REATransition
@property (nonatomic) ABI46_0_0REATransitionAnimationType animationType;
- (ABI46_0_0REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (ABI46_0_0REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI46_0_0REAInTransition : ABI46_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI46_0_0REAOutTransition : ABI46_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI46_0_0REAChangeTransition : ABI46_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
