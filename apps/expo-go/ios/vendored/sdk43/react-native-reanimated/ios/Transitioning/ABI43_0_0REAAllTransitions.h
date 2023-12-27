#import "ABI43_0_0REATransition.h"

@interface ABI43_0_0REATransitionGroup : ABI43_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI43_0_0REAVisibilityTransition : ABI43_0_0REATransition
@property (nonatomic) ABI43_0_0REATransitionAnimationType animationType;
- (ABI43_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI43_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI43_0_0REAInTransition : ABI43_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI43_0_0REAOutTransition : ABI43_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI43_0_0REAChangeTransition : ABI43_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
