#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI43_0_0React/ABI43_0_0RCTView.h>

#import "ABI43_0_0REATransitionAnimation.h"
#import "ABI43_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI43_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI43_0_0REATransitionType) {
  ABI43_0_0REATransitionTypeNone = 0,
  ABI43_0_0REATransitionTypeGroup,
  ABI43_0_0REATransitionTypeIn,
  ABI43_0_0REATransitionTypeOut,
  ABI43_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI43_0_0REATransitionAnimationType) {
  ABI43_0_0REATransitionAnimationTypeNone = 0,
  ABI43_0_0REATransitionAnimationTypeFade,
  ABI43_0_0REATransitionAnimationTypeScale,
  ABI43_0_0REATransitionAnimationTypeSlideTop,
  ABI43_0_0REATransitionAnimationTypeSlideBottom,
  ABI43_0_0REATransitionAnimationTypeSlideRight,
  ABI43_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI43_0_0REATransitionInterpolationType) {
  ABI43_0_0REATransitionInterpolationLinear = 0,
  ABI43_0_0REATransitionInterpolationEaseIn,
  ABI43_0_0REATransitionInterpolationEaseOut,
  ABI43_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI43_0_0REATransitionPropagationType) {
  ABI43_0_0REATransitionPropagationNone = 0,
  ABI43_0_0REATransitionPropagationTop,
  ABI43_0_0REATransitionPropagationBottom,
  ABI43_0_0REATransitionPropagationLeft,
  ABI43_0_0REATransitionPropagationRight,
};

@interface ABI43_0_0REATransition : NSObject
@property (nonatomic, weak) ABI43_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI43_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI43_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI43_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI43_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI43_0_0REATransitionAnimation *)animationForTransitioning:(ABI43_0_0REATransitionValues*)startValues
                                               endValues:(ABI43_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI43_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI43_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI43_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI43_0_0REATransition *)inflate:(NSDictionary *)config;
@end
