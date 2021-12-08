#import <QuartzCore/QuartzCore.h>
#import <ABI44_0_0React/ABI44_0_0RCTView.h>
#import <UIKit/UIKit.h>

#import "ABI44_0_0REATransitionAnimation.h"
#import "ABI44_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI44_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI44_0_0REATransitionType) {
  ABI44_0_0REATransitionTypeNone = 0,
  ABI44_0_0REATransitionTypeGroup,
  ABI44_0_0REATransitionTypeIn,
  ABI44_0_0REATransitionTypeOut,
  ABI44_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI44_0_0REATransitionAnimationType) {
  ABI44_0_0REATransitionAnimationTypeNone = 0,
  ABI44_0_0REATransitionAnimationTypeFade,
  ABI44_0_0REATransitionAnimationTypeScale,
  ABI44_0_0REATransitionAnimationTypeSlideTop,
  ABI44_0_0REATransitionAnimationTypeSlideBottom,
  ABI44_0_0REATransitionAnimationTypeSlideRight,
  ABI44_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI44_0_0REATransitionInterpolationType) {
  ABI44_0_0REATransitionInterpolationLinear = 0,
  ABI44_0_0REATransitionInterpolationEaseIn,
  ABI44_0_0REATransitionInterpolationEaseOut,
  ABI44_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI44_0_0REATransitionPropagationType) {
  ABI44_0_0REATransitionPropagationNone = 0,
  ABI44_0_0REATransitionPropagationTop,
  ABI44_0_0REATransitionPropagationBottom,
  ABI44_0_0REATransitionPropagationLeft,
  ABI44_0_0REATransitionPropagationRight,
};

@interface ABI44_0_0REATransition : NSObject
@property (nonatomic, weak) ABI44_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI44_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI44_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI44_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI44_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI44_0_0REATransitionAnimation *)animationForTransitioning:(ABI44_0_0REATransitionValues *)startValues
                                            endValues:(ABI44_0_0REATransitionValues *)endValues
                                              forRoot:(UIView *)root;
- (NSArray<ABI44_0_0REATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, ABI44_0_0REATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, ABI44_0_0REATransitionValues *> *)endValues
                       forRoot:(UIView *)root;

+ (ABI44_0_0REATransition *)inflate:(NSDictionary *)config;
@end
