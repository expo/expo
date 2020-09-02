
#import "ABI39_0_0RCTConvert+UIPageViewControllerTransitionStyle.h"

@implementation ABI39_0_0RCTConvert (UIPageViewControllerTransitionStyle)

ABI39_0_0RCT_ENUM_CONVERTER(UIPageViewControllerTransitionStyle, (@{
                                                           @"scroll": @(UIPageViewControllerTransitionStyleScroll),
                                                           @"curl": @(UIPageViewControllerTransitionStylePageCurl),
                                                           }), UIPageViewControllerTransitionStyleScroll, integerValue)

@end
