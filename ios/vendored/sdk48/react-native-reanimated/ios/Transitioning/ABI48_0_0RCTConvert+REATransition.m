#import <ABI48_0_0RNReanimated/ABI48_0_0RCTConvert+REATransition.h>

@implementation ABI48_0_0RCTConvert (ABI48_0_0REATransition)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0REATransitionType,
    (@{
      @"none" : @(ABI48_0_0REATransitionTypeNone),
      @"group" : @(ABI48_0_0REATransitionTypeGroup),
      @"in" : @(ABI48_0_0REATransitionTypeIn),
      @"out" : @(ABI48_0_0REATransitionTypeOut),
      @"change" : @(ABI48_0_0REATransitionTypeChange),
    }),
    ABI48_0_0REATransitionTypeNone,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0REATransitionAnimationType,
    (@{
      @"none" : @(ABI48_0_0REATransitionAnimationTypeNone),
      @"fade" : @(ABI48_0_0REATransitionAnimationTypeFade),
      @"scale" : @(ABI48_0_0REATransitionAnimationTypeScale),
      @"slide-top" : @(ABI48_0_0REATransitionAnimationTypeSlideTop),
      @"slide-bottom" : @(ABI48_0_0REATransitionAnimationTypeSlideBottom),
      @"slide-right" : @(ABI48_0_0REATransitionAnimationTypeSlideRight),
      @"slide-left" : @(ABI48_0_0REATransitionAnimationTypeSlideLeft)
    }),
    ABI48_0_0REATransitionAnimationTypeNone,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0REATransitionInterpolationType,
    (@{
      @"linear" : @(ABI48_0_0REATransitionInterpolationLinear),
      @"easeIn" : @(ABI48_0_0REATransitionInterpolationEaseIn),
      @"easeOut" : @(ABI48_0_0REATransitionInterpolationEaseOut),
      @"easeInOut" : @(ABI48_0_0REATransitionInterpolationEaseInOut),
    }),
    ABI48_0_0REATransitionInterpolationLinear,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0REATransitionPropagationType,
    (@{
      @"none" : @(ABI48_0_0REATransitionPropagationNone),
      @"top" : @(ABI48_0_0REATransitionPropagationTop),
      @"bottom" : @(ABI48_0_0REATransitionPropagationBottom),
      @"left" : @(ABI48_0_0REATransitionPropagationLeft),
      @"right" : @(ABI48_0_0REATransitionPropagationRight)
    }),
    ABI48_0_0REATransitionPropagationNone,
    integerValue)
@end
