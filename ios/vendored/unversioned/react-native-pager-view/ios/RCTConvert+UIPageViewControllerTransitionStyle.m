
#import "RCTConvert+UIPageViewControllerTransitionStyle.h"

@implementation RCTConvert (UIPageViewControllerTransitionStyle)

RCT_ENUM_CONVERTER(UIPageViewControllerTransitionStyle, (@{
                                                           @"scroll": @(UIPageViewControllerTransitionStyleScroll),
                                                           @"curl": @(UIPageViewControllerTransitionStylePageCurl),
                                                           }), UIPageViewControllerTransitionStyleScroll, integerValue)

@end
