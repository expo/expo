#import "ABI35_0_0REATransition.h"

@interface ABI35_0_0REATransitionGroup : ABI35_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI35_0_0REAVisibilityTransition : ABI35_0_0REATransition
@property (nonatomic) ABI35_0_0REATransitionAnimationType animationType;
- (ABI35_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI35_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI35_0_0REAInTransition : ABI35_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI35_0_0REAOutTransition : ABI35_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI35_0_0REAChangeTransition : ABI35_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
