
#import "ABI45_0_0RCTConvert+UIPageViewControllerTransitionStyle.h"

@implementation ABI45_0_0RCTConvert (UIPageViewControllerTransitionStyle)

ABI45_0_0RCT_ENUM_CONVERTER(UIPageViewControllerTransitionStyle, (@{
                                                           @"scroll": @(UIPageViewControllerTransitionStyleScroll),
                                                           @"curl": @(UIPageViewControllerTransitionStylePageCurl),
                                                           }), UIPageViewControllerTransitionStyleScroll, integerValue)

@end
