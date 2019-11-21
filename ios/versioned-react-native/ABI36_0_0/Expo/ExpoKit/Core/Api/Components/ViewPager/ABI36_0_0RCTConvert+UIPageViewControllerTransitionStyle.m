
#import "ABI36_0_0RCTConvert+UIPageViewControllerTransitionStyle.h"

@implementation ABI36_0_0RCTConvert (UIPageViewControllerTransitionStyle)

ABI36_0_0RCT_ENUM_CONVERTER(UIPageViewControllerTransitionStyle, (@{
                                                           @"scroll": @(UIPageViewControllerTransitionStyleScroll),
                                                           @"curl": @(UIPageViewControllerTransitionStylePageCurl),
                                                           }), UIPageViewControllerTransitionStyleScroll, integerValue)

@end
