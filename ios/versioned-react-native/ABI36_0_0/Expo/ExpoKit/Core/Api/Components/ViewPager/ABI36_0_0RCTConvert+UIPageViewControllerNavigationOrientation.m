
#import "ABI36_0_0RCTConvert+UIPageViewControllerNavigationOrientation.h"

@implementation ABI36_0_0RCTConvert (UIPageViewControllerNavigationOrientation)

ABI36_0_0RCT_ENUM_CONVERTER(UIPageViewControllerNavigationOrientation, (@{
                                                                 @"horizontal": @(UIPageViewControllerNavigationOrientationHorizontal),
                                                                 @"vertical": @(UIPageViewControllerNavigationOrientationVertical),
                                                                 }), UIPageViewControllerNavigationOrientationHorizontal, integerValue)

@end
