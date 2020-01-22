#import "ABI33_0_0RCTConvert+REATransition.h"

@implementation ABI33_0_0RCTConvert (ABI33_0_0REATransition)

ABI33_0_0RCT_ENUM_CONVERTER(ABI33_0_0REATransitionType, (@{
                                         @"none": @(ABI33_0_0REATransitionTypeNone),
                                         @"group": @(ABI33_0_0REATransitionTypeGroup),
                                         @"in": @(ABI33_0_0REATransitionTypeIn),
                                         @"out": @(ABI33_0_0REATransitionTypeOut),
                                         @"change": @(ABI33_0_0REATransitionTypeChange),
                                         }), ABI33_0_0REATransitionTypeNone, integerValue)

ABI33_0_0RCT_ENUM_CONVERTER(ABI33_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI33_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI33_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI33_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI33_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI33_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI33_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI33_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI33_0_0REATransitionAnimationTypeNone, integerValue)

ABI33_0_0RCT_ENUM_CONVERTER(ABI33_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI33_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI33_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI33_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI33_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI33_0_0REATransitionInterpolationLinear, integerValue)

ABI33_0_0RCT_ENUM_CONVERTER(ABI33_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI33_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI33_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI33_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI33_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI33_0_0REATransitionPropagationRight)
                                                    }), ABI33_0_0REATransitionPropagationNone, integerValue)
@end
