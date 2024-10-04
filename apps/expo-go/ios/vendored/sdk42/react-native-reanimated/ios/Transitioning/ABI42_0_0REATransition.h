#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>

#import "ABI42_0_0REATransitionAnimation.h"
#import "ABI42_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI42_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI42_0_0REATransitionType) {
  ABI42_0_0REATransitionTypeNone = 0,
  ABI42_0_0REATransitionTypeGroup,
  ABI42_0_0REATransitionTypeIn,
  ABI42_0_0REATransitionTypeOut,
  ABI42_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI42_0_0REATransitionAnimationType) {
  ABI42_0_0REATransitionAnimationTypeNone = 0,
  ABI42_0_0REATransitionAnimationTypeFade,
  ABI42_0_0REATransitionAnimationTypeScale,
  ABI42_0_0REATransitionAnimationTypeSlideTop,
  ABI42_0_0REATransitionAnimationTypeSlideBottom,
  ABI42_0_0REATransitionAnimationTypeSlideRight,
  ABI42_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI42_0_0REATransitionInterpolationType) {
  ABI42_0_0REATransitionInterpolationLinear = 0,
  ABI42_0_0REATransitionInterpolationEaseIn,
  ABI42_0_0REATransitionInterpolationEaseOut,
  ABI42_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI42_0_0REATransitionPropagationType) {
  ABI42_0_0REATransitionPropagationNone = 0,
  ABI42_0_0REATransitionPropagationTop,
  ABI42_0_0REATransitionPropagationBottom,
  ABI42_0_0REATransitionPropagationLeft,
  ABI42_0_0REATransitionPropagationRight,
};

@interface ABI42_0_0REATransition : NSObject
@property (nonatomic, weak) ABI42_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI42_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI42_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI42_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI42_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI42_0_0REATransitionAnimation *)animationForTransitioning:(ABI42_0_0REATransitionValues*)startValues
                                               endValues:(ABI42_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI42_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI42_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI42_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI42_0_0REATransition *)inflate:(NSDictionary *)config;
@end
