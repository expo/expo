#import <ABI45_0_0RNReanimated/ABI45_0_0RCTConvert+REATransition.h>

@implementation ABI45_0_0RCTConvert (ABI45_0_0REATransition)

ABI45_0_0RCT_ENUM_CONVERTER(
    ABI45_0_0REATransitionType,
    (@{
      @"none" : @(ABI45_0_0REATransitionTypeNone),
      @"group" : @(ABI45_0_0REATransitionTypeGroup),
      @"in" : @(ABI45_0_0REATransitionTypeIn),
      @"out" : @(ABI45_0_0REATransitionTypeOut),
      @"change" : @(ABI45_0_0REATransitionTypeChange),
    }),
    ABI45_0_0REATransitionTypeNone,
    integerValue)

ABI45_0_0RCT_ENUM_CONVERTER(
    ABI45_0_0REATransitionAnimationType,
    (@{
      @"none" : @(ABI45_0_0REATransitionAnimationTypeNone),
      @"fade" : @(ABI45_0_0REATransitionAnimationTypeFade),
      @"scale" : @(ABI45_0_0REATransitionAnimationTypeScale),
      @"slide-top" : @(ABI45_0_0REATransitionAnimationTypeSlideTop),
      @"slide-bottom" : @(ABI45_0_0REATransitionAnimationTypeSlideBottom),
      @"slide-right" : @(ABI45_0_0REATransitionAnimationTypeSlideRight),
      @"slide-left" : @(ABI45_0_0REATransitionAnimationTypeSlideLeft)
    }),
    ABI45_0_0REATransitionAnimationTypeNone,
    integerValue)

ABI45_0_0RCT_ENUM_CONVERTER(
    ABI45_0_0REATransitionInterpolationType,
    (@{
      @"linear" : @(ABI45_0_0REATransitionInterpolationLinear),
      @"easeIn" : @(ABI45_0_0REATransitionInterpolationEaseIn),
      @"easeOut" : @(ABI45_0_0REATransitionInterpolationEaseOut),
      @"easeInOut" : @(ABI45_0_0REATransitionInterpolationEaseInOut),
    }),
    ABI45_0_0REATransitionInterpolationLinear,
    integerValue)

ABI45_0_0RCT_ENUM_CONVERTER(
    ABI45_0_0REATransitionPropagationType,
    (@{
      @"none" : @(ABI45_0_0REATransitionPropagationNone),
      @"top" : @(ABI45_0_0REATransitionPropagationTop),
      @"bottom" : @(ABI45_0_0REATransitionPropagationBottom),
      @"left" : @(ABI45_0_0REATransitionPropagationLeft),
      @"right" : @(ABI45_0_0REATransitionPropagationRight)
    }),
    ABI45_0_0REATransitionPropagationNone,
    integerValue)
@end
