#import <QuartzCore/QuartzCore.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REATransitionAnimation.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REATransitionValues.h>
#import <ABI46_0_0React/ABI46_0_0RCTView.h>
#import <UIKit/UIKit.h>

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI46_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI46_0_0REATransitionType) {
  ABI46_0_0REATransitionTypeNone = 0,
  ABI46_0_0REATransitionTypeGroup,
  ABI46_0_0REATransitionTypeIn,
  ABI46_0_0REATransitionTypeOut,
  ABI46_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI46_0_0REATransitionAnimationType) {
  ABI46_0_0REATransitionAnimationTypeNone = 0,
  ABI46_0_0REATransitionAnimationTypeFade,
  ABI46_0_0REATransitionAnimationTypeScale,
  ABI46_0_0REATransitionAnimationTypeSlideTop,
  ABI46_0_0REATransitionAnimationTypeSlideBottom,
  ABI46_0_0REATransitionAnimationTypeSlideRight,
  ABI46_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI46_0_0REATransitionInterpolationType) {
  ABI46_0_0REATransitionInterpolationLinear = 0,
  ABI46_0_0REATransitionInterpolationEaseIn,
  ABI46_0_0REATransitionInterpolationEaseOut,
  ABI46_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI46_0_0REATransitionPropagationType) {
  ABI46_0_0REATransitionPropagationNone = 0,
  ABI46_0_0REATransitionPropagationTop,
  ABI46_0_0REATransitionPropagationBottom,
  ABI46_0_0REATransitionPropagationLeft,
  ABI46_0_0REATransitionPropagationRight,
};

@interface ABI46_0_0REATransition : NSObject
@property (nonatomic, weak) ABI46_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI46_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI46_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI46_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI46_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI46_0_0REATransitionAnimation *)animationForTransitioning:(ABI46_0_0REATransitionValues *)startValues
                                            endValues:(ABI46_0_0REATransitionValues *)endValues
                                              forRoot:(UIView *)root;
- (NSArray<ABI46_0_0REATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, ABI46_0_0REATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, ABI46_0_0REATransitionValues *> *)endValues
                       forRoot:(UIView *)root;

+ (ABI46_0_0REATransition *)inflate:(NSDictionary *)config;
@end
