#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI39_0_0React/ABI39_0_0RCTView.h>

#import "ABI39_0_0REATransitionAnimation.h"
#import "ABI39_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI39_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI39_0_0REATransitionType) {
  ABI39_0_0REATransitionTypeNone = 0,
  ABI39_0_0REATransitionTypeGroup,
  ABI39_0_0REATransitionTypeIn,
  ABI39_0_0REATransitionTypeOut,
  ABI39_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI39_0_0REATransitionAnimationType) {
  ABI39_0_0REATransitionAnimationTypeNone = 0,
  ABI39_0_0REATransitionAnimationTypeFade,
  ABI39_0_0REATransitionAnimationTypeScale,
  ABI39_0_0REATransitionAnimationTypeSlideTop,
  ABI39_0_0REATransitionAnimationTypeSlideBottom,
  ABI39_0_0REATransitionAnimationTypeSlideRight,
  ABI39_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI39_0_0REATransitionInterpolationType) {
  ABI39_0_0REATransitionInterpolationLinear = 0,
  ABI39_0_0REATransitionInterpolationEaseIn,
  ABI39_0_0REATransitionInterpolationEaseOut,
  ABI39_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI39_0_0REATransitionPropagationType) {
  ABI39_0_0REATransitionPropagationNone = 0,
  ABI39_0_0REATransitionPropagationTop,
  ABI39_0_0REATransitionPropagationBottom,
  ABI39_0_0REATransitionPropagationLeft,
  ABI39_0_0REATransitionPropagationRight,
};

@interface ABI39_0_0REATransition : NSObject
@property (nonatomic, weak) ABI39_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI39_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI39_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI39_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI39_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI39_0_0REATransitionAnimation *)animationForTransitioning:(ABI39_0_0REATransitionValues*)startValues
                                               endValues:(ABI39_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI39_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI39_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI39_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI39_0_0REATransition *)inflate:(NSDictionary *)config;
@end
