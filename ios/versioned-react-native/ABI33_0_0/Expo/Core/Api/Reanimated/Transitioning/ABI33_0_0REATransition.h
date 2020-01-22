#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ReactABI33_0_0/ABI33_0_0RCTView.h>

#import "ABI33_0_0REATransitionAnimation.h"
#import "ABI33_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI33_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI33_0_0REATransitionType) {
  ABI33_0_0REATransitionTypeNone = 0,
  ABI33_0_0REATransitionTypeGroup,
  ABI33_0_0REATransitionTypeIn,
  ABI33_0_0REATransitionTypeOut,
  ABI33_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI33_0_0REATransitionAnimationType) {
  ABI33_0_0REATransitionAnimationTypeNone = 0,
  ABI33_0_0REATransitionAnimationTypeFade,
  ABI33_0_0REATransitionAnimationTypeScale,
  ABI33_0_0REATransitionAnimationTypeSlideTop,
  ABI33_0_0REATransitionAnimationTypeSlideBottom,
  ABI33_0_0REATransitionAnimationTypeSlideRight,
  ABI33_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI33_0_0REATransitionInterpolationType) {
  ABI33_0_0REATransitionInterpolationLinear = 0,
  ABI33_0_0REATransitionInterpolationEaseIn,
  ABI33_0_0REATransitionInterpolationEaseOut,
  ABI33_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI33_0_0REATransitionPropagationType) {
  ABI33_0_0REATransitionPropagationNone = 0,
  ABI33_0_0REATransitionPropagationTop,
  ABI33_0_0REATransitionPropagationBottom,
  ABI33_0_0REATransitionPropagationLeft,
  ABI33_0_0REATransitionPropagationRight,
};

@interface ABI33_0_0REATransition : NSObject
@property (nonatomic, weak) ABI33_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI33_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI33_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI33_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI33_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI33_0_0REATransitionAnimation *)animationForTransitioning:(ABI33_0_0REATransitionValues*)startValues
                                               endValues:(ABI33_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI33_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI33_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI33_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI33_0_0REATransition *)inflate:(NSDictionary *)config;
@end
