
#import "ABI40_0_0RCTConvert+UIPageViewControllerNavigationOrientation.h"

@implementation ABI40_0_0RCTConvert (UIPageViewControllerNavigationOrientation)

ABI40_0_0RCT_ENUM_CONVERTER(UIPageViewControllerNavigationOrientation, (@{
                                                                 @"horizontal": @(UIPageViewControllerNavigationOrientationHorizontal),
                                                                 @"vertical": @(UIPageViewControllerNavigationOrientationVertical),
                                                                 }), UIPageViewControllerNavigationOrientationHorizontal, integerValue)

@end
