#import "REATransition.h"

@interface REATransitionGroup : REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface REAVisibilityTransition : REATransition
@property (nonatomic) REATransitionAnimationType animationType;
- (REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface REAInTransition : REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface REAOutTransition : REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface REAChangeTransition : REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end
