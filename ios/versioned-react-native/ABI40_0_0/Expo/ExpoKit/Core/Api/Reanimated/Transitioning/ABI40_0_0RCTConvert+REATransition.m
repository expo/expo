#import "ABI40_0_0RCTConvert+REATransition.h"

@implementation ABI40_0_0RCTConvert (ABI40_0_0REATransition)

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0REATransitionType, (@{
                                         @"none": @(ABI40_0_0REATransitionTypeNone),
                                         @"group": @(ABI40_0_0REATransitionTypeGroup),
                                         @"in": @(ABI40_0_0REATransitionTypeIn),
                                         @"out": @(ABI40_0_0REATransitionTypeOut),
                                         @"change": @(ABI40_0_0REATransitionTypeChange),
                                         }), ABI40_0_0REATransitionTypeNone, integerValue)

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI40_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI40_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI40_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI40_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI40_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI40_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI40_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI40_0_0REATransitionAnimationTypeNone, integerValue)

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI40_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI40_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI40_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI40_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI40_0_0REATransitionInterpolationLinear, integerValue)

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI40_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI40_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI40_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI40_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI40_0_0REATransitionPropagationRight)
                                                    }), ABI40_0_0REATransitionPropagationNone, integerValue)
@end
