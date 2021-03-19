#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI41_0_0React/ABI41_0_0RCTView.h>

#import "ABI41_0_0REATransitionAnimation.h"
#import "ABI41_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI41_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI41_0_0REATransitionType) {
  ABI41_0_0REATransitionTypeNone = 0,
  ABI41_0_0REATransitionTypeGroup,
  ABI41_0_0REATransitionTypeIn,
  ABI41_0_0REATransitionTypeOut,
  ABI41_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI41_0_0REATransitionAnimationType) {
  ABI41_0_0REATransitionAnimationTypeNone = 0,
  ABI41_0_0REATransitionAnimationTypeFade,
  ABI41_0_0REATransitionAnimationTypeScale,
  ABI41_0_0REATransitionAnimationTypeSlideTop,
  ABI41_0_0REATransitionAnimationTypeSlideBottom,
  ABI41_0_0REATransitionAnimationTypeSlideRight,
  ABI41_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI41_0_0REATransitionInterpolationType) {
  ABI41_0_0REATransitionInterpolationLinear = 0,
  ABI41_0_0REATransitionInterpolationEaseIn,
  ABI41_0_0REATransitionInterpolationEaseOut,
  ABI41_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI41_0_0REATransitionPropagationType) {
  ABI41_0_0REATransitionPropagationNone = 0,
  ABI41_0_0REATransitionPropagationTop,
  ABI41_0_0REATransitionPropagationBottom,
  ABI41_0_0REATransitionPropagationLeft,
  ABI41_0_0REATransitionPropagationRight,
};

@interface ABI41_0_0REATransition : NSObject
@property (nonatomic, weak) ABI41_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI41_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI41_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI41_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI41_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI41_0_0REATransitionAnimation *)animationForTransitioning:(ABI41_0_0REATransitionValues*)startValues
                                               endValues:(ABI41_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI41_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI41_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI41_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI41_0_0REATransition *)inflate:(NSDictionary *)config;
@end
