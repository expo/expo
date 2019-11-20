#import "ABI34_0_0RCTConvert+REATransition.h"

@implementation ABI34_0_0RCTConvert (ABI34_0_0REATransition)

ABI34_0_0RCT_ENUM_CONVERTER(ABI34_0_0REATransitionType, (@{
                                         @"none": @(ABI34_0_0REATransitionTypeNone),
                                         @"group": @(ABI34_0_0REATransitionTypeGroup),
                                         @"in": @(ABI34_0_0REATransitionTypeIn),
                                         @"out": @(ABI34_0_0REATransitionTypeOut),
                                         @"change": @(ABI34_0_0REATransitionTypeChange),
                                         }), ABI34_0_0REATransitionTypeNone, integerValue)

ABI34_0_0RCT_ENUM_CONVERTER(ABI34_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI34_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI34_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI34_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI34_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI34_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI34_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI34_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI34_0_0REATransitionAnimationTypeNone, integerValue)

ABI34_0_0RCT_ENUM_CONVERTER(ABI34_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI34_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI34_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI34_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI34_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI34_0_0REATransitionInterpolationLinear, integerValue)

ABI34_0_0RCT_ENUM_CONVERTER(ABI34_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI34_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI34_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI34_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI34_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI34_0_0REATransitionPropagationRight)
                                                    }), ABI34_0_0REATransitionPropagationNone, integerValue)
@end
