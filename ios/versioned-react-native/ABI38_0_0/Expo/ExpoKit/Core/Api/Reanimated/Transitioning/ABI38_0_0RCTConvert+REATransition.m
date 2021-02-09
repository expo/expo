#import "ABI38_0_0RCTConvert+REATransition.h"

@implementation ABI38_0_0RCTConvert (ABI38_0_0REATransition)

ABI38_0_0RCT_ENUM_CONVERTER(ABI38_0_0REATransitionType, (@{
                                         @"none": @(ABI38_0_0REATransitionTypeNone),
                                         @"group": @(ABI38_0_0REATransitionTypeGroup),
                                         @"in": @(ABI38_0_0REATransitionTypeIn),
                                         @"out": @(ABI38_0_0REATransitionTypeOut),
                                         @"change": @(ABI38_0_0REATransitionTypeChange),
                                         }), ABI38_0_0REATransitionTypeNone, integerValue)

ABI38_0_0RCT_ENUM_CONVERTER(ABI38_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI38_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI38_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI38_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI38_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI38_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI38_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI38_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI38_0_0REATransitionAnimationTypeNone, integerValue)

ABI38_0_0RCT_ENUM_CONVERTER(ABI38_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI38_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI38_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI38_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI38_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI38_0_0REATransitionInterpolationLinear, integerValue)

ABI38_0_0RCT_ENUM_CONVERTER(ABI38_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI38_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI38_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI38_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI38_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI38_0_0REATransitionPropagationRight)
                                                    }), ABI38_0_0REATransitionPropagationNone, integerValue)
@end
