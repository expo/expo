
#import "ABI38_0_0RCTConvert+UIPageViewControllerTransitionStyle.h"

@implementation ABI38_0_0RCTConvert (UIPageViewControllerTransitionStyle)

ABI38_0_0RCT_ENUM_CONVERTER(UIPageViewControllerTransitionStyle, (@{
                                                           @"scroll": @(UIPageViewControllerTransitionStyleScroll),
                                                           @"curl": @(UIPageViewControllerTransitionStylePageCurl),
                                                           }), UIPageViewControllerTransitionStyleScroll, integerValue)

@end
