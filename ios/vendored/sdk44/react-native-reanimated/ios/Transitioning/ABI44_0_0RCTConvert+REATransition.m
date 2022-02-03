#import "ABI44_0_0RCTConvert+REATransition.h"

@implementation ABI44_0_0RCTConvert (ABI44_0_0REATransition)

ABI44_0_0RCT_ENUM_CONVERTER(
    ABI44_0_0REATransitionType,
    (@{
      @"none" : @(ABI44_0_0REATransitionTypeNone),
      @"group" : @(ABI44_0_0REATransitionTypeGroup),
      @"in" : @(ABI44_0_0REATransitionTypeIn),
      @"out" : @(ABI44_0_0REATransitionTypeOut),
      @"change" : @(ABI44_0_0REATransitionTypeChange),
    }),
    ABI44_0_0REATransitionTypeNone,
    integerValue)

ABI44_0_0RCT_ENUM_CONVERTER(
    ABI44_0_0REATransitionAnimationType,
    (@{
      @"none" : @(ABI44_0_0REATransitionAnimationTypeNone),
      @"fade" : @(ABI44_0_0REATransitionAnimationTypeFade),
      @"scale" : @(ABI44_0_0REATransitionAnimationTypeScale),
      @"slide-top" : @(ABI44_0_0REATransitionAnimationTypeSlideTop),
      @"slide-bottom" : @(ABI44_0_0REATransitionAnimationTypeSlideBottom),
      @"slide-right" : @(ABI44_0_0REATransitionAnimationTypeSlideRight),
      @"slide-left" : @(ABI44_0_0REATransitionAnimationTypeSlideLeft)
    }),
    ABI44_0_0REATransitionAnimationTypeNone,
    integerValue)

ABI44_0_0RCT_ENUM_CONVERTER(
    ABI44_0_0REATransitionInterpolationType,
    (@{
      @"linear" : @(ABI44_0_0REATransitionInterpolationLinear),
      @"easeIn" : @(ABI44_0_0REATransitionInterpolationEaseIn),
      @"easeOut" : @(ABI44_0_0REATransitionInterpolationEaseOut),
      @"easeInOut" : @(ABI44_0_0REATransitionInterpolationEaseInOut),
    }),
    ABI44_0_0REATransitionInterpolationLinear,
    integerValue)

ABI44_0_0RCT_ENUM_CONVERTER(
    ABI44_0_0REATransitionPropagationType,
    (@{
      @"none" : @(ABI44_0_0REATransitionPropagationNone),
      @"top" : @(ABI44_0_0REATransitionPropagationTop),
      @"bottom" : @(ABI44_0_0REATransitionPropagationBottom),
      @"left" : @(ABI44_0_0REATransitionPropagationLeft),
      @"right" : @(ABI44_0_0REATransitionPropagationRight)
    }),
    ABI44_0_0REATransitionPropagationNone,
    integerValue)
@end
