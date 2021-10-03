#import "ABI43_0_0RCTConvert+REATransition.h"

@implementation ABI43_0_0RCTConvert (ABI43_0_0REATransition)

ABI43_0_0RCT_ENUM_CONVERTER(ABI43_0_0REATransitionType, (@{
                                         @"none": @(ABI43_0_0REATransitionTypeNone),
                                         @"group": @(ABI43_0_0REATransitionTypeGroup),
                                         @"in": @(ABI43_0_0REATransitionTypeIn),
                                         @"out": @(ABI43_0_0REATransitionTypeOut),
                                         @"change": @(ABI43_0_0REATransitionTypeChange),
                                         }), ABI43_0_0REATransitionTypeNone, integerValue)

ABI43_0_0RCT_ENUM_CONVERTER(ABI43_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI43_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI43_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI43_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI43_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI43_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI43_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI43_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI43_0_0REATransitionAnimationTypeNone, integerValue)

ABI43_0_0RCT_ENUM_CONVERTER(ABI43_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI43_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI43_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI43_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI43_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI43_0_0REATransitionInterpolationLinear, integerValue)

ABI43_0_0RCT_ENUM_CONVERTER(ABI43_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI43_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI43_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI43_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI43_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI43_0_0REATransitionPropagationRight)
                                                    }), ABI43_0_0REATransitionPropagationNone, integerValue)
@end
