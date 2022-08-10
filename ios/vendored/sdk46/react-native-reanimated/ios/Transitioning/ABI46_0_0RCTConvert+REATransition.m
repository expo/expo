#import <ABI46_0_0RNReanimated/ABI46_0_0RCTConvert+REATransition.h>

@implementation ABI46_0_0RCTConvert (ABI46_0_0REATransition)

ABI46_0_0RCT_ENUM_CONVERTER(
    ABI46_0_0REATransitionType,
    (@{
      @"none" : @(ABI46_0_0REATransitionTypeNone),
      @"group" : @(ABI46_0_0REATransitionTypeGroup),
      @"in" : @(ABI46_0_0REATransitionTypeIn),
      @"out" : @(ABI46_0_0REATransitionTypeOut),
      @"change" : @(ABI46_0_0REATransitionTypeChange),
    }),
    ABI46_0_0REATransitionTypeNone,
    integerValue)

ABI46_0_0RCT_ENUM_CONVERTER(
    ABI46_0_0REATransitionAnimationType,
    (@{
      @"none" : @(ABI46_0_0REATransitionAnimationTypeNone),
      @"fade" : @(ABI46_0_0REATransitionAnimationTypeFade),
      @"scale" : @(ABI46_0_0REATransitionAnimationTypeScale),
      @"slide-top" : @(ABI46_0_0REATransitionAnimationTypeSlideTop),
      @"slide-bottom" : @(ABI46_0_0REATransitionAnimationTypeSlideBottom),
      @"slide-right" : @(ABI46_0_0REATransitionAnimationTypeSlideRight),
      @"slide-left" : @(ABI46_0_0REATransitionAnimationTypeSlideLeft)
    }),
    ABI46_0_0REATransitionAnimationTypeNone,
    integerValue)

ABI46_0_0RCT_ENUM_CONVERTER(
    ABI46_0_0REATransitionInterpolationType,
    (@{
      @"linear" : @(ABI46_0_0REATransitionInterpolationLinear),
      @"easeIn" : @(ABI46_0_0REATransitionInterpolationEaseIn),
      @"easeOut" : @(ABI46_0_0REATransitionInterpolationEaseOut),
      @"easeInOut" : @(ABI46_0_0REATransitionInterpolationEaseInOut),
    }),
    ABI46_0_0REATransitionInterpolationLinear,
    integerValue)

ABI46_0_0RCT_ENUM_CONVERTER(
    ABI46_0_0REATransitionPropagationType,
    (@{
      @"none" : @(ABI46_0_0REATransitionPropagationNone),
      @"top" : @(ABI46_0_0REATransitionPropagationTop),
      @"bottom" : @(ABI46_0_0REATransitionPropagationBottom),
      @"left" : @(ABI46_0_0REATransitionPropagationLeft),
      @"right" : @(ABI46_0_0REATransitionPropagationRight)
    }),
    ABI46_0_0REATransitionPropagationNone,
    integerValue)
@end
