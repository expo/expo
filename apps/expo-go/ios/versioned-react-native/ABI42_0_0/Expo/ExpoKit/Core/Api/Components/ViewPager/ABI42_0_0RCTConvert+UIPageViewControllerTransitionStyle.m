
#import "ABI42_0_0RCTConvert+UIPageViewControllerTransitionStyle.h"

@implementation ABI42_0_0RCTConvert (UIPageViewControllerTransitionStyle)

ABI42_0_0RCT_ENUM_CONVERTER(UIPageViewControllerTransitionStyle, (@{
                                                           @"scroll": @(UIPageViewControllerTransitionStyleScroll),
                                                           @"curl": @(UIPageViewControllerTransitionStylePageCurl),
                                                           }), UIPageViewControllerTransitionStyleScroll, integerValue)

@end
