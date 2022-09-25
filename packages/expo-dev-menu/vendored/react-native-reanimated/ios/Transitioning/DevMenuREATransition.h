#import <QuartzCore/QuartzCore.h>
#import "DevMenuREATransitionAnimation.h"
#import "DevMenuREATransitionValues.h"
#import <React/RCTView.h>
#import <UIKit/UIKit.h>

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, DevMenuREATransitionType) {
  DevMenuREATransitionTypeNone = 0,
  DevMenuREATransitionTypeGroup,
  DevMenuREATransitionTypeIn,
  DevMenuREATransitionTypeOut,
  DevMenuREATransitionTypeChange
};

typedef NS_ENUM(NSInteger, DevMenuREATransitionAnimationType) {
  DevMenuREATransitionAnimationTypeNone = 0,
  DevMenuREATransitionAnimationTypeFade,
  DevMenuREATransitionAnimationTypeScale,
  DevMenuREATransitionAnimationTypeSlideTop,
  DevMenuREATransitionAnimationTypeSlideBottom,
  DevMenuREATransitionAnimationTypeSlideRight,
  DevMenuREATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, DevMenuREATransitionInterpolationType) {
  DevMenuREATransitionInterpolationLinear = 0,
  DevMenuREATransitionInterpolationEaseIn,
  DevMenuREATransitionInterpolationEaseOut,
  DevMenuREATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, DevMenuREATransitionPropagationType) {
  DevMenuREATransitionPropagationNone = 0,
  DevMenuREATransitionPropagationTop,
  DevMenuREATransitionPropagationBottom,
  DevMenuREATransitionPropagationLeft,
  DevMenuREATransitionPropagationRight,
};

@interface DevMenuREATransition : NSObject
@property (nonatomic, weak) DevMenuREATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) DevMenuREATransitionInterpolationType interpolation;
@property (nonatomic) DevMenuREATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (DevMenuREATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (DevMenuREATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (DevMenuREATransitionAnimation *)animationForTransitioning:(DevMenuREATransitionValues *)startValues
                                            endValues:(DevMenuREATransitionValues *)endValues
                                              forRoot:(UIView *)root;
- (NSArray<DevMenuREATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *)endValues
                       forRoot:(UIView *)root;

+ (DevMenuREATransition *)inflate:(NSDictionary *)config;
@end
