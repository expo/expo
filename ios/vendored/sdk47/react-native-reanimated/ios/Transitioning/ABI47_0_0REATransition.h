#import <QuartzCore/QuartzCore.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REATransitionAnimation.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REATransitionValues.h>
#import <ABI47_0_0React/ABI47_0_0RCTView.h>
#import <UIKit/UIKit.h>

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI47_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI47_0_0REATransitionType) {
  ABI47_0_0REATransitionTypeNone = 0,
  ABI47_0_0REATransitionTypeGroup,
  ABI47_0_0REATransitionTypeIn,
  ABI47_0_0REATransitionTypeOut,
  ABI47_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI47_0_0REATransitionAnimationType) {
  ABI47_0_0REATransitionAnimationTypeNone = 0,
  ABI47_0_0REATransitionAnimationTypeFade,
  ABI47_0_0REATransitionAnimationTypeScale,
  ABI47_0_0REATransitionAnimationTypeSlideTop,
  ABI47_0_0REATransitionAnimationTypeSlideBottom,
  ABI47_0_0REATransitionAnimationTypeSlideRight,
  ABI47_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI47_0_0REATransitionInterpolationType) {
  ABI47_0_0REATransitionInterpolationLinear = 0,
  ABI47_0_0REATransitionInterpolationEaseIn,
  ABI47_0_0REATransitionInterpolationEaseOut,
  ABI47_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI47_0_0REATransitionPropagationType) {
  ABI47_0_0REATransitionPropagationNone = 0,
  ABI47_0_0REATransitionPropagationTop,
  ABI47_0_0REATransitionPropagationBottom,
  ABI47_0_0REATransitionPropagationLeft,
  ABI47_0_0REATransitionPropagationRight,
};

@interface ABI47_0_0REATransition : NSObject
@property (nonatomic, weak) ABI47_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI47_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI47_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI47_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI47_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI47_0_0REATransitionAnimation *)animationForTransitioning:(ABI47_0_0REATransitionValues *)startValues
                                            endValues:(ABI47_0_0REATransitionValues *)endValues
                                              forRoot:(UIView *)root;
- (NSArray<ABI47_0_0REATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, ABI47_0_0REATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, ABI47_0_0REATransitionValues *> *)endValues
                       forRoot:(UIView *)root;

+ (ABI47_0_0REATransition *)inflate:(NSDictionary *)config;
@end
