#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI36_0_0React/ABI36_0_0RCTView.h>

#import "ABI36_0_0REATransitionAnimation.h"
#import "ABI36_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI36_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI36_0_0REATransitionType) {
  ABI36_0_0REATransitionTypeNone = 0,
  ABI36_0_0REATransitionTypeGroup,
  ABI36_0_0REATransitionTypeIn,
  ABI36_0_0REATransitionTypeOut,
  ABI36_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI36_0_0REATransitionAnimationType) {
  ABI36_0_0REATransitionAnimationTypeNone = 0,
  ABI36_0_0REATransitionAnimationTypeFade,
  ABI36_0_0REATransitionAnimationTypeScale,
  ABI36_0_0REATransitionAnimationTypeSlideTop,
  ABI36_0_0REATransitionAnimationTypeSlideBottom,
  ABI36_0_0REATransitionAnimationTypeSlideRight,
  ABI36_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI36_0_0REATransitionInterpolationType) {
  ABI36_0_0REATransitionInterpolationLinear = 0,
  ABI36_0_0REATransitionInterpolationEaseIn,
  ABI36_0_0REATransitionInterpolationEaseOut,
  ABI36_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI36_0_0REATransitionPropagationType) {
  ABI36_0_0REATransitionPropagationNone = 0,
  ABI36_0_0REATransitionPropagationTop,
  ABI36_0_0REATransitionPropagationBottom,
  ABI36_0_0REATransitionPropagationLeft,
  ABI36_0_0REATransitionPropagationRight,
};

@interface ABI36_0_0REATransition : NSObject
@property (nonatomic, weak) ABI36_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI36_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI36_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI36_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI36_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI36_0_0REATransitionAnimation *)animationForTransitioning:(ABI36_0_0REATransitionValues*)startValues
                                               endValues:(ABI36_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI36_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI36_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI36_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI36_0_0REATransition *)inflate:(NSDictionary *)config;
@end
