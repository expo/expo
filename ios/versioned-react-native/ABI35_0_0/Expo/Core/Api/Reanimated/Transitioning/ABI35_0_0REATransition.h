#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ReactABI35_0_0/ABI35_0_0RCTView.h>

#import "ABI35_0_0REATransitionAnimation.h"
#import "ABI35_0_0REATransitionValues.h"

// TODO: fix below implementation
#define IS_LAYOUT_ONLY(view) ([view isKindOfClass:[ABI35_0_0RCTView class]] && view.backgroundColor == nil)

typedef NS_ENUM(NSInteger, ABI35_0_0REATransitionType) {
  ABI35_0_0REATransitionTypeNone = 0,
  ABI35_0_0REATransitionTypeGroup,
  ABI35_0_0REATransitionTypeIn,
  ABI35_0_0REATransitionTypeOut,
  ABI35_0_0REATransitionTypeChange
};

typedef NS_ENUM(NSInteger, ABI35_0_0REATransitionAnimationType) {
  ABI35_0_0REATransitionAnimationTypeNone = 0,
  ABI35_0_0REATransitionAnimationTypeFade,
  ABI35_0_0REATransitionAnimationTypeScale,
  ABI35_0_0REATransitionAnimationTypeSlideTop,
  ABI35_0_0REATransitionAnimationTypeSlideBottom,
  ABI35_0_0REATransitionAnimationTypeSlideRight,
  ABI35_0_0REATransitionAnimationTypeSlideLeft,
};

typedef NS_ENUM(NSInteger, ABI35_0_0REATransitionInterpolationType) {
  ABI35_0_0REATransitionInterpolationLinear = 0,
  ABI35_0_0REATransitionInterpolationEaseIn,
  ABI35_0_0REATransitionInterpolationEaseOut,
  ABI35_0_0REATransitionInterpolationEaseInOut,
};

typedef NS_ENUM(NSInteger, ABI35_0_0REATransitionPropagationType) {
  ABI35_0_0REATransitionPropagationNone = 0,
  ABI35_0_0REATransitionPropagationTop,
  ABI35_0_0REATransitionPropagationBottom,
  ABI35_0_0REATransitionPropagationLeft,
  ABI35_0_0REATransitionPropagationRight,
};

@interface ABI35_0_0REATransition : NSObject
@property (nonatomic, weak) ABI35_0_0REATransition *parent;
@property (nonatomic) CFTimeInterval duration;
@property (nonatomic) CFTimeInterval delay;
@property (nonatomic) ABI35_0_0REATransitionInterpolationType interpolation;
@property (nonatomic) ABI35_0_0REATransitionPropagationType propagation;
- (instancetype)initWithConfig:(NSDictionary *)config;
- (CAMediaTimingFunction *)mediaTiming;
- (void)startCaptureInRoot:(UIView *)root;
- (void)playInRoot:(UIView *)root;
- (ABI35_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key;
- (ABI35_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key;
- (ABI35_0_0REATransitionAnimation *)animationForTransitioning:(ABI35_0_0REATransitionValues*)startValues
                                               endValues:(ABI35_0_0REATransitionValues*)endValues
                                                 forRoot:(UIView *)root;
- (NSArray<ABI35_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber*, ABI35_0_0REATransitionValues*> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber*, ABI35_0_0REATransitionValues*> *)endValues
                                                            forRoot:(UIView *)root;

+ (ABI35_0_0REATransition *)inflate:(NSDictionary *)config;
@end
