
#import "ABI45_0_0RCTConvert+UIPageViewControllerNavigationOrientation.h"

@implementation ABI45_0_0RCTConvert (UIPageViewControllerNavigationOrientation)

ABI45_0_0RCT_ENUM_CONVERTER(UIPageViewControllerNavigationOrientation, (@{
                                                                 @"horizontal": @(UIPageViewControllerNavigationOrientationHorizontal),
                                                                 @"vertical": @(UIPageViewControllerNavigationOrientationVertical),
                                                                 }), UIPageViewControllerNavigationOrientationHorizontal, integerValue)

@end
