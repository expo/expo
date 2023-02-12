#import <ABI47_0_0RNReanimated/ABI47_0_0RCTConvert+REATransition.h>

@implementation ABI47_0_0RCTConvert (ABI47_0_0REATransition)

ABI47_0_0RCT_ENUM_CONVERTER(
    ABI47_0_0REATransitionType,
    (@{
      @"none" : @(ABI47_0_0REATransitionTypeNone),
      @"group" : @(ABI47_0_0REATransitionTypeGroup),
      @"in" : @(ABI47_0_0REATransitionTypeIn),
      @"out" : @(ABI47_0_0REATransitionTypeOut),
      @"change" : @(ABI47_0_0REATransitionTypeChange),
    }),
    ABI47_0_0REATransitionTypeNone,
    integerValue)

ABI47_0_0RCT_ENUM_CONVERTER(
    ABI47_0_0REATransitionAnimationType,
    (@{
      @"none" : @(ABI47_0_0REATransitionAnimationTypeNone),
      @"fade" : @(ABI47_0_0REATransitionAnimationTypeFade),
      @"scale" : @(ABI47_0_0REATransitionAnimationTypeScale),
      @"slide-top" : @(ABI47_0_0REATransitionAnimationTypeSlideTop),
      @"slide-bottom" : @(ABI47_0_0REATransitionAnimationTypeSlideBottom),
      @"slide-right" : @(ABI47_0_0REATransitionAnimationTypeSlideRight),
      @"slide-left" : @(ABI47_0_0REATransitionAnimationTypeSlideLeft)
    }),
    ABI47_0_0REATransitionAnimationTypeNone,
    integerValue)

ABI47_0_0RCT_ENUM_CONVERTER(
    ABI47_0_0REATransitionInterpolationType,
    (@{
      @"linear" : @(ABI47_0_0REATransitionInterpolationLinear),
      @"easeIn" : @(ABI47_0_0REATransitionInterpolationEaseIn),
      @"easeOut" : @(ABI47_0_0REATransitionInterpolationEaseOut),
      @"easeInOut" : @(ABI47_0_0REATransitionInterpolationEaseInOut),
    }),
    ABI47_0_0REATransitionInterpolationLinear,
    integerValue)

ABI47_0_0RCT_ENUM_CONVERTER(
    ABI47_0_0REATransitionPropagationType,
    (@{
      @"none" : @(ABI47_0_0REATransitionPropagationNone),
      @"top" : @(ABI47_0_0REATransitionPropagationTop),
      @"bottom" : @(ABI47_0_0REATransitionPropagationBottom),
      @"left" : @(ABI47_0_0REATransitionPropagationLeft),
      @"right" : @(ABI47_0_0REATransitionPropagationRight)
    }),
    ABI47_0_0REATransitionPropagationNone,
    integerValue)
@end
