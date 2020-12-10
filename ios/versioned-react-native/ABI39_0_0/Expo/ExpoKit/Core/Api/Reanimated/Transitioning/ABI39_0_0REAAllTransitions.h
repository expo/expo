#import "ABI39_0_0REATransition.h"

@interface ABI39_0_0REATransitionGroup : ABI39_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI39_0_0REAVisibilityTransition : ABI39_0_0REATransition
@property (nonatomic) ABI39_0_0REATransitionAnimationType animationType;
- (ABI39_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI39_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI39_0_0REAInTransition : ABI39_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI39_0_0REAOutTransition : ABI39_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI39_0_0REAChangeTransition : ABI39_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
