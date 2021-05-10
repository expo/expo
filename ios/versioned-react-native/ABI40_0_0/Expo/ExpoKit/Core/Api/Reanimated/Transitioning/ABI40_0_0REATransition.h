#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI40_0_0React/ABI40_0_0RCTView.h>

#import "ABI40_0_0REATransitionAnimation.h"
#import "ABI40_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI40_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI40_0_0REATransitionType) {
  ABI40_0_0REATransitionTypeNone = 0,
  ABI40_0_0REATransitionTypeGroup,
  ABI40_0_0REATransitionTypeIn,
  ABI40_0_0REATransitionTypeOut,
  ABI40_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI40_0_0REATransitionAnimationType) {
  ABI40_0_0REATransitionAnimationTypeNone = 0,
  ABI40_0_0REATransitionAnimationTypeFade,
  ABI40_0_0REATransitionAnimationTypeScale,
  ABI40_0_0REATransitionAnimationTypeSlideTop,
  ABI40_0_0REATransitionAnimationTypeSlideBottom,
  ABI40_0_0REATransitionAnimationTypeSlideRight,
  ABI40_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI40_0_0REATransitionInterpolationType) {
  ABI40_0_0REATransitionInterpolationLinear = 0,
  ABI40_0_0REATransitionInterpolationEaseIn,
  ABI40_0_0REATransitionInterpolationEaseOut,
  ABI40_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI40_0_0REATransitionPropagationType) {
  ABI40_0_0REATransitionPropagationNone = 0,
  ABI40_0_0REATransitionPropagationTop,
  ABI40_0_0REATransitionPropagationBottom,
  ABI40_0_0REATransitionPropagationLeft,
  ABI40_0_0REATransitionPropagationRight,
};

@interface ABI40_0_0REATransition : NSObject
@property (nonatomic, weak) ABI40_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI40_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI40_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI40_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI40_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI40_0_0REATransitionAnimation *)animationForTransitioning:(ABI40_0_0REATransitionValues*)startValues
                                               endValues:(ABI40_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI40_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI40_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI40_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI40_0_0REATransition *)inflate:(NSDictionary *)config;
@end
