#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI38_0_0React/ABI38_0_0RCTView.h>

#import "ABI38_0_0REATransitionAnimation.h"
#import "ABI38_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI38_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI38_0_0REATransitionType) {
  ABI38_0_0REATransitionTypeNone = 0,
  ABI38_0_0REATransitionTypeGroup,
  ABI38_0_0REATransitionTypeIn,
  ABI38_0_0REATransitionTypeOut,
  ABI38_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI38_0_0REATransitionAnimationType) {
  ABI38_0_0REATransitionAnimationTypeNone = 0,
  ABI38_0_0REATransitionAnimationTypeFade,
  ABI38_0_0REATransitionAnimationTypeScale,
  ABI38_0_0REATransitionAnimationTypeSlideTop,
  ABI38_0_0REATransitionAnimationTypeSlideBottom,
  ABI38_0_0REATransitionAnimationTypeSlideRight,
  ABI38_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI38_0_0REATransitionInterpolationType) {
  ABI38_0_0REATransitionInterpolationLinear = 0,
  ABI38_0_0REATransitionInterpolationEaseIn,
  ABI38_0_0REATransitionInterpolationEaseOut,
  ABI38_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI38_0_0REATransitionPropagationType) {
  ABI38_0_0REATransitionPropagationNone = 0,
  ABI38_0_0REATransitionPropagationTop,
  ABI38_0_0REATransitionPropagationBottom,
  ABI38_0_0REATransitionPropagationLeft,
  ABI38_0_0REATransitionPropagationRight,
};

@interface ABI38_0_0REATransition : NSObject
@property (nonatomic, weak) ABI38_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI38_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI38_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI38_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI38_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI38_0_0REATransitionAnimation *)animationForTransitioning:(ABI38_0_0REATransitionValues*)startValues
                                               endValues:(ABI38_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI38_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI38_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI38_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI38_0_0REATransition *)inflate:(NSDictionary *)config;
@end
