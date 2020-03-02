#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI37_0_0React/ABI37_0_0RCTView.h>

#import "ABI37_0_0REATransitionAnimation.h"
#import "ABI37_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI37_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI37_0_0REATransitionType) {
  ABI37_0_0REATransitionTypeNone = 0,
  ABI37_0_0REATransitionTypeGroup,
  ABI37_0_0REATransitionTypeIn,
  ABI37_0_0REATransitionTypeOut,
  ABI37_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI37_0_0REATransitionAnimationType) {
  ABI37_0_0REATransitionAnimationTypeNone = 0,
  ABI37_0_0REATransitionAnimationTypeFade,
  ABI37_0_0REATransitionAnimationTypeScale,
  ABI37_0_0REATransitionAnimationTypeSlideTop,
  ABI37_0_0REATransitionAnimationTypeSlideBottom,
  ABI37_0_0REATransitionAnimationTypeSlideRight,
  ABI37_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI37_0_0REATransitionInterpolationType) {
  ABI37_0_0REATransitionInterpolationLinear = 0,
  ABI37_0_0REATransitionInterpolationEaseIn,
  ABI37_0_0REATransitionInterpolationEaseOut,
  ABI37_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI37_0_0REATransitionPropagationType) {
  ABI37_0_0REATransitionPropagationNone = 0,
  ABI37_0_0REATransitionPropagationTop,
  ABI37_0_0REATransitionPropagationBottom,
  ABI37_0_0REATransitionPropagationLeft,
  ABI37_0_0REATransitionPropagationRight,
};

@interface ABI37_0_0REATransition : NSObject
@property (nonatomic, weak) ABI37_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI37_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI37_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI37_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI37_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI37_0_0REATransitionAnimation *)animationForTransitioning:(ABI37_0_0REATransitionValues*)startValues
                                               endValues:(ABI37_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI37_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI37_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI37_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI37_0_0REATransition *)inflate:(NSDictionary *)config;
@end
