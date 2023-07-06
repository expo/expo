
#import "ABI49_0_0RCTConvert+UIPageViewControllerNavigationOrientation.h"

@implementation ABI49_0_0RCTConvert (UIPageViewControllerNavigationOrientation)

ABI49_0_0RCT_ENUM_CONVERTER(UIPageViewControllerNavigationOrientation, (@{
                                                                 @"horizontal": @(UIPageViewControllerNavigationOrientationHorizontal),
                                                                 @"vertical": @(UIPageViewControllerNavigationOrientationVertical),
                                                                 }), UIPageViewControllerNavigationOrientationHorizontal, integerValue)

@end
