#import "DevMenuREATransition.h"

@interface DevMenuREATransitionGroup : DevMenuREATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface DevMenuREAVisibilityTransition : DevMenuREATransition
@property (nonatomic) DevMenuREATransitionAnimationType animationType;
- (DevMenuREATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (DevMenuREATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface DevMenuREAInTransition : DevMenuREAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface DevMenuREAOutTransition : DevMenuREAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface DevMenuREAChangeTransition : DevMenuREATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
