#import <QuartzCore/QuartzCore.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REATransitionAnimation.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REATransitionValues.h>
#import <ABI45_0_0React/ABI45_0_0RCTView.h>
#import <UIKit/UIKit.h>

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI45_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI45_0_0REATransitionType) {
  ABI45_0_0REATransitionTypeNone = 0,
  ABI45_0_0REATransitionTypeGroup,
  ABI45_0_0REATransitionTypeIn,
  ABI45_0_0REATransitionTypeOut,
  ABI45_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI45_0_0REATransitionAnimationType) {
  ABI45_0_0REATransitionAnimationTypeNone = 0,
  ABI45_0_0REATransitionAnimationTypeFade,
  ABI45_0_0REATransitionAnimationTypeScale,
  ABI45_0_0REATransitionAnimationTypeSlideTop,
  ABI45_0_0REATransitionAnimationTypeSlideBottom,
  ABI45_0_0REATransitionAnimationTypeSlideRight,
  ABI45_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI45_0_0REATransitionInterpolationType) {
  ABI45_0_0REATransitionInterpolationLinear = 0,
  ABI45_0_0REATransitionInterpolationEaseIn,
  ABI45_0_0REATransitionInterpolationEaseOut,
  ABI45_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI45_0_0REATransitionPropagationType) {
  ABI45_0_0REATransitionPropagationNone = 0,
  ABI45_0_0REATransitionPropagationTop,
  ABI45_0_0REATransitionPropagationBottom,
  ABI45_0_0REATransitionPropagationLeft,
  ABI45_0_0REATransitionPropagationRight,
};

@interface ABI45_0_0REATransition : NSObject
@property (nonatomic, weak) ABI45_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI45_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI45_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI45_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI45_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI45_0_0REATransitionAnimation *)animationForTransitioning:(ABI45_0_0REATransitionValues *)startValues
                                            endValues:(ABI45_0_0REATransitionValues *)endValues
                                              forRoot:(UIView *)root;
- (NSArray<ABI45_0_0REATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, ABI45_0_0REATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, ABI45_0_0REATransitionValues *> *)endValues
                       forRoot:(UIView *)root;

+ (ABI45_0_0REATransition *)inflate:(NSDictionary *)config;
@end
