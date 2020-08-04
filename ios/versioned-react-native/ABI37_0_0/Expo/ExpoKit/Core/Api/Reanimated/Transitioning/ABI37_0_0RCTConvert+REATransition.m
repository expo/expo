#import "ABI37_0_0RCTConvert+REATransition.h"

@implementation ABI37_0_0RCTConvert (ABI37_0_0REATransition)

ABI37_0_0RCT_ENUM_CONVERTER(ABI37_0_0REATransitionType, (@{
                                         @"none": @(ABI37_0_0REATransitionTypeNone),
                                         @"group": @(ABI37_0_0REATransitionTypeGroup),
                                         @"in": @(ABI37_0_0REATransitionTypeIn),
                                         @"out": @(ABI37_0_0REATransitionTypeOut),
                                         @"change": @(ABI37_0_0REATransitionTypeChange),
                                         }), ABI37_0_0REATransitionTypeNone, integerValue)

ABI37_0_0RCT_ENUM_CONVERTER(ABI37_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI37_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI37_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI37_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI37_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI37_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI37_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI37_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI37_0_0REATransitionAnimationTypeNone, integerValue)

ABI37_0_0RCT_ENUM_CONVERTER(ABI37_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI37_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI37_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI37_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI37_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI37_0_0REATransitionInterpolationLinear, integerValue)

ABI37_0_0RCT_ENUM_CONVERTER(ABI37_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI37_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI37_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI37_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI37_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI37_0_0REATransitionPropagationRight)
                                                    }), ABI37_0_0REATransitionPropagationNone, integerValue)
@end
