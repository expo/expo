
#import "ABI41_0_0RCTConvert+UIPageViewControllerNavigationOrientation.h"

@implementation ABI41_0_0RCTConvert (UIPageViewControllerNavigationOrientation)

ABI41_0_0RCT_ENUM_CONVERTER(UIPageViewControllerNavigationOrientation, (@{
                                                                 @"horizontal": @(UIPageViewControllerNavigationOrientationHorizontal),
                                                                 @"vertical": @(UIPageViewControllerNavigationOrientationVertical),
                                                                 }), UIPageViewControllerNavigationOrientationHorizontal, integerValue)

@end
