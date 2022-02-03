
#import "ABI44_0_0RCTConvert+UIPageViewControllerNavigationOrientation.h"

@implementation ABI44_0_0RCTConvert (UIPageViewControllerNavigationOrientation)

ABI44_0_0RCT_ENUM_CONVERTER(UIPageViewControllerNavigationOrientation, (@{
                                                                 @"horizontal": @(UIPageViewControllerNavigationOrientationHorizontal),
                                                                 @"vertical": @(UIPageViewControllerNavigationOrientationVertical),
                                                                 }), UIPageViewControllerNavigationOrientationHorizontal, integerValue)

@end
