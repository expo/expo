#import "RCTConvert+DevMenuREATransition.h"

@implementation RCTConvert (DevMenuREATransition)

RCT_ENUM_CONVERTER(
    DevMenuREATransitionType,
    (@{
      @"none" : @(DevMenuREATransitionTypeNone),
      @"group" : @(DevMenuREATransitionTypeGroup),
      @"in" : @(DevMenuREATransitionTypeIn),
      @"out" : @(DevMenuREATransitionTypeOut),
      @"change" : @(DevMenuREATransitionTypeChange),
    }),
    DevMenuREATransitionTypeNone,
    integerValue)

RCT_ENUM_CONVERTER(
    DevMenuREATransitionAnimationType,
    (@{
      @"none" : @(DevMenuREATransitionAnimationTypeNone),
      @"fade" : @(DevMenuREATransitionAnimationTypeFade),
      @"scale" : @(DevMenuREATransitionAnimationTypeScale),
      @"slide-top" : @(DevMenuREATransitionAnimationTypeSlideTop),
      @"slide-bottom" : @(DevMenuREATransitionAnimationTypeSlideBottom),
      @"slide-right" : @(DevMenuREATransitionAnimationTypeSlideRight),
      @"slide-left" : @(DevMenuREATransitionAnimationTypeSlideLeft)
    }),
    DevMenuREATransitionAnimationTypeNone,
    integerValue)

RCT_ENUM_CONVERTER(
    DevMenuREATransitionInterpolationType,
    (@{
      @"linear" : @(DevMenuREATransitionInterpolationLinear),
      @"easeIn" : @(DevMenuREATransitionInterpolationEaseIn),
      @"easeOut" : @(DevMenuREATransitionInterpolationEaseOut),
      @"easeInOut" : @(DevMenuREATransitionInterpolationEaseInOut),
    }),
    DevMenuREATransitionInterpolationLinear,
    integerValue)

RCT_ENUM_CONVERTER(
    DevMenuREATransitionPropagationType,
    (@{
      @"none" : @(DevMenuREATransitionPropagationNone),
      @"top" : @(DevMenuREATransitionPropagationTop),
      @"bottom" : @(DevMenuREATransitionPropagationBottom),
      @"left" : @(DevMenuREATransitionPropagationLeft),
      @"right" : @(DevMenuREATransitionPropagationRight)
    }),
    DevMenuREATransitionPropagationNone,
    integerValue)
@end
