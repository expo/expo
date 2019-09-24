#import "ABI35_0_0RCTConvert+REATransition.h"

@implementation ABI35_0_0RCTConvert (ABI35_0_0REATransition)

ABI35_0_0RCT_ENUM_CONVERTER(ABI35_0_0REATransitionType, (@{
                                         @"none": @(ABI35_0_0REATransitionTypeNone),
                                         @"group": @(ABI35_0_0REATransitionTypeGroup),
                                         @"in": @(ABI35_0_0REATransitionTypeIn),
                                         @"out": @(ABI35_0_0REATransitionTypeOut),
                                         @"change": @(ABI35_0_0REATransitionTypeChange),
                                         }), ABI35_0_0REATransitionTypeNone, integerValue)

ABI35_0_0RCT_ENUM_CONVERTER(ABI35_0_0REATransitionAnimationType, (@{
                                                  @"none": @(ABI35_0_0REATransitionAnimationTypeNone),
                                                  @"fade": @(ABI35_0_0REATransitionAnimationTypeFade),
                                                  @"scale": @(ABI35_0_0REATransitionAnimationTypeScale),
                                                  @"slide-top": @(ABI35_0_0REATransitionAnimationTypeSlideTop),
                                                  @"slide-bottom": @(ABI35_0_0REATransitionAnimationTypeSlideBottom),
                                                  @"slide-right": @(ABI35_0_0REATransitionAnimationTypeSlideRight),
                                                  @"slide-left": @(ABI35_0_0REATransitionAnimationTypeSlideLeft)
                                                  }), ABI35_0_0REATransitionAnimationTypeNone, integerValue)

ABI35_0_0RCT_ENUM_CONVERTER(ABI35_0_0REATransitionInterpolationType, (@{
                                                      @"linear": @(ABI35_0_0REATransitionInterpolationLinear),
                                                      @"easeIn": @(ABI35_0_0REATransitionInterpolationEaseIn),
                                                      @"easeOut": @(ABI35_0_0REATransitionInterpolationEaseOut),
                                                      @"easeInOut": @(ABI35_0_0REATransitionInterpolationEaseInOut),
                                                      }), ABI35_0_0REATransitionInterpolationLinear, integerValue)

ABI35_0_0RCT_ENUM_CONVERTER(ABI35_0_0REATransitionPropagationType, (@{
                                                    @"none": @(ABI35_0_0REATransitionPropagationNone),
                                                    @"top": @(ABI35_0_0REATransitionPropagationTop),
                                                    @"bottom": @(ABI35_0_0REATransitionPropagationBottom),
                                                    @"left": @(ABI35_0_0REATransitionPropagationLeft),
                                                    @"right": @(ABI35_0_0REATransitionPropagationRight)
                                                    }), ABI35_0_0REATransitionPropagationNone, integerValue)
@end
