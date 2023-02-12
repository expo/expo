#import <QuartzCore/QuartzCore.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REATransitionAnimation.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REATransitionValues.h>
#import <ABI48_0_0React/ABI48_0_0RCTView.h>
#import <UIKit/UIKit.h>

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI48_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI48_0_0REATransitionType) {
  ABI48_0_0REATransitionTypeNone = 0,
  ABI48_0_0REATransitionTypeGroup,
  ABI48_0_0REATransitionTypeIn,
  ABI48_0_0REATransitionTypeOut,
  ABI48_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI48_0_0REATransitionAnimationType) {
  ABI48_0_0REATransitionAnimationTypeNone = 0,
  ABI48_0_0REATransitionAnimationTypeFade,
  ABI48_0_0REATransitionAnimationTypeScale,
  ABI48_0_0REATransitionAnimationTypeSlideTop,
  ABI48_0_0REATransitionAnimationTypeSlideBottom,
  ABI48_0_0REATransitionAnimationTypeSlideRight,
  ABI48_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI48_0_0REATransitionInterpolationType) {
  ABI48_0_0REATransitionInterpolationLinear = 0,
  ABI48_0_0REATransitionInterpolationEaseIn,
  ABI48_0_0REATransitionInterpolationEaseOut,
  ABI48_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI48_0_0REATransitionPropagationType) {
  ABI48_0_0REATransitionPropagationNone = 0,
  ABI48_0_0REATransitionPropagationTop,
  ABI48_0_0REATransitionPropagationBottom,
  ABI48_0_0REATransitionPropagationLeft,
  ABI48_0_0REATransitionPropagationRight,
};

@interface ABI48_0_0REATransition : NSObject
@property (nonatomic, weak) ABI48_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI48_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI48_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI48_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI48_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI48_0_0REATransitionAnimation *)animationForTransitioning:(ABI48_0_0REATransitionValues *)startValues
                                            endValues:(ABI48_0_0REATransitionValues *)endValues
                                              forRoot:(UIView *)root;
- (NSArray<ABI48_0_0REATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, ABI48_0_0REATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, ABI48_0_0REATransitionValues *> *)endValues
                       forRoot:(UIView *)root;

+ (ABI48_0_0REATransition *)inflate:(NSDictionary *)config;
@end
