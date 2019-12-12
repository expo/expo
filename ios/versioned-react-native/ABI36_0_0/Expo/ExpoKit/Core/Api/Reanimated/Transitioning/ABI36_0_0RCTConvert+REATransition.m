#import "ABI36_0_0RCTConvert+REATransition.h"

@implementation ABI36_0_0RCTConvert (ABI36_0_0REATransition)

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0REATransitionType, (@{
                                         @"none": @(ABI36_0_0REATransitionTypeNone),
                                         @"group": @(ABI36_0_0REATransitionTypeGroup),
                                         @"in": @(ABI36_0_0REATransitionTypeIn),
                                         @"out": @(ABI36_0_0REATransitionTypeOut),
                                         @"change": @(ABI36_0_0REATransitionTypeChange),
                                         }), ABI36_0_0REATransitionTypeNone, integerValue)

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI36_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI36_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI36_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI36_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI36_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI36_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI36_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI36_0_0REATransitionAnimationTypeNone, integerValue)

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI36_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI36_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI36_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI36_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI36_0_0REATransitionInterpolationLinear, integerValue)

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI36_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI36_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI36_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI36_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI36_0_0REATransitionPropagationRight)
                                                    }), ABI36_0_0REATransitionPropagationNone, integerValue)
@end
