#import "ABI38_0_0REATransition.h"

@interface ABI38_0_0REATransitionGroup : ABI38_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI38_0_0REAVisibilityTransition : ABI38_0_0REATransition
@property (nonatomic) ABI38_0_0REATransitionAnimationType animationType;
- (ABI38_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI38_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI38_0_0REAInTransition : ABI38_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI38_0_0REAOutTransition : ABI38_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI38_0_0REAChangeTransition : ABI38_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
