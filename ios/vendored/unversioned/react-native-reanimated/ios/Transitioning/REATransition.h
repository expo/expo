#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <React/RCTView.h>

#import "REATransitionAnimation.h"
#import "REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, REATransitionType) {
  REATransitionTypeNone = 0,
  REATransitionTypeGroup,
  REATransitionTypeIn,
  REATransitionTypeOut,
  REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, REATransitionAnimationType) {
  REATransitionAnimationTypeNone = 0,
  REATransitionAnimationTypeFade,
  REATransitionAnimationTypeScale,
  REATransitionAnimationTypeSlideTop,
  REATransitionAnimationTypeSlideBottom,
  REATransitionAnimationTypeSlideRight,
  REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, REATransitionInterpolationType) {
  REATransitionInterpolationLinear = 0,
  REATransitionInterpolationEaseIn,
  REATransitionInterpolationEaseOut,
  REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, REATransitionPropagationType) {
  REATransitionPropagationNone = 0,
  REATransitionPropagationTop,
  REATransitionPropagationBottom,
  REATransitionPropagationLeft,
  REATransitionPropagationRight,
};

@interface REATransition : NSObject
@property (nonatomic, weak) REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) REATransitionInterpolationType interpolation;
@property (nonatomic) REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (REATransitionAnimation *)animationForTransitioning:(REATransitionValues*)startValues
                                               endValues:(REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (REATransition *)inflate:(NSDictionary *)config;
@end
