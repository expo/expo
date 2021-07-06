#import "ABI41_0_0RCTConvert+REATransition.h"

@implementation ABI41_0_0RCTConvert (ABI41_0_0REATransition)

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0REATransitionType, (@{
                                         @"none": @(ABI41_0_0REATransitionTypeNone),
                                         @"group": @(ABI41_0_0REATransitionTypeGroup),
                                         @"in": @(ABI41_0_0REATransitionTypeIn),
                                         @"out": @(ABI41_0_0REATransitionTypeOut),
                                         @"change": @(ABI41_0_0REATransitionTypeChange),
                                         }), ABI41_0_0REATransitionTypeNone, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI41_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI41_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI41_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI41_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI41_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI41_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI41_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI41_0_0REATransitionAnimationTypeNone, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI41_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI41_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI41_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI41_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI41_0_0REATransitionInterpolationLinear, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI41_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI41_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI41_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI41_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI41_0_0REATransitionPropagationRight)
                                                    }), ABI41_0_0REATransitionPropagationNone, integerValue)
@end
