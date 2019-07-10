#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ReactABI34_0_0/ABI34_0_0RCTView.h>

#import "ABI34_0_0REATransitionAnimation.h"
#import "ABI34_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI34_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI34_0_0REATransitionType) {
  ABI34_0_0REATransitionTypeNone = 0,
  ABI34_0_0REATransitionTypeGroup,
  ABI34_0_0REATransitionTypeIn,
  ABI34_0_0REATransitionTypeOut,
  ABI34_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI34_0_0REATransitionAnimationType) {
  ABI34_0_0REATransitionAnimationTypeNone = 0,
  ABI34_0_0REATransitionAnimationTypeFade,
  ABI34_0_0REATransitionAnimationTypeScale,
  ABI34_0_0REATransitionAnimationTypeSlideTop,
  ABI34_0_0REATransitionAnimationTypeSlideBottom,
  ABI34_0_0REATransitionAnimationTypeSlideRight,
  ABI34_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI34_0_0REATransitionInterpolationType) {
  ABI34_0_0REATransitionInterpolationLinear = 0,
  ABI34_0_0REATransitionInterpolationEaseIn,
  ABI34_0_0REATransitionInterpolationEaseOut,
  ABI34_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI34_0_0REATransitionPropagationType) {
  ABI34_0_0REATransitionPropagationNone = 0,
  ABI34_0_0REATransitionPropagationTop,
  ABI34_0_0REATransitionPropagationBottom,
  ABI34_0_0REATransitionPropagationLeft,
  ABI34_0_0REATransitionPropagationRight,
};

@interface ABI34_0_0REATransition : NSObject
@property (nonatomic, weak) ABI34_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI34_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI34_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI34_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI34_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI34_0_0REATransitionAnimation *)animationForTransitioning:(ABI34_0_0REATransitionValues*)startValues
                                               endValues:(ABI34_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI34_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI34_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI34_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI34_0_0REATransition *)inflate:(NSDictionary *)config;
@end
