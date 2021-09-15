#import "ABI42_0_0RCTConvert+REATransition.h"

@implementation ABI42_0_0RCTConvert (ABI42_0_0REATransition)

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0REATransitionType, (@{
                                         @"none": @(ABI42_0_0REATransitionTypeNone),
                                         @"group": @(ABI42_0_0REATransitionTypeGroup),
                                         @"in": @(ABI42_0_0REATransitionTypeIn),
                                         @"out": @(ABI42_0_0REATransitionTypeOut),
                                         @"change": @(ABI42_0_0REATransitionTypeChange),
                                         }), ABI42_0_0REATransitionTypeNone, integerValue)

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI42_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI42_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI42_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI42_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI42_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI42_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI42_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI42_0_0REATransitionAnimationTypeNone, integerValue)

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI42_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI42_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI42_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI42_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI42_0_0REATransitionInterpolationLinear, integerValue)

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI42_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI42_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI42_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI42_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI42_0_0REATransitionPropagationRight)
                                                    }), ABI42_0_0REATransitionPropagationNone, integerValue)
@end
