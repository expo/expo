#import "ABI39_0_0RCTConvert+REATransition.h"

@implementation ABI39_0_0RCTConvert (ABI39_0_0REATransition)

ABI39_0_0RCT_ENUM_CONVERTER(ABI39_0_0REATransitionType, (@{
                                         @"none": @(ABI39_0_0REATransitionTypeNone),
                                         @"group": @(ABI39_0_0REATransitionTypeGroup),
                                         @"in": @(ABI39_0_0REATransitionTypeIn),
                                         @"out": @(ABI39_0_0REATransitionTypeOut),
                                         @"change": @(ABI39_0_0REATransitionTypeChange),
                                         }), ABI39_0_0REATransitionTypeNone, integerValue)

ABI39_0_0RCT_ENUM_CONVERTER(ABI39_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI39_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI39_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI39_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI39_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI39_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI39_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI39_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI39_0_0REATransitionAnimationTypeNone, integerValue)

ABI39_0_0RCT_ENUM_CONVERTER(ABI39_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI39_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI39_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI39_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI39_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI39_0_0REATransitionInterpolationLinear, integerValue)

ABI39_0_0RCT_ENUM_CONVERTER(ABI39_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI39_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI39_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI39_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI39_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI39_0_0REATransitionPropagationRight)
                                                    }), ABI39_0_0REATransitionPropagationNone, integerValue)
@end
