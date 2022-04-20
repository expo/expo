#import "ABI45_0_0RNCSafeAreaViewMode.h"
#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>

@implementation ABI45_0_0RCTConvert (ABI45_0_0RNCSafeAreaView)

ABI45_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI45_0_0RNCSafeAreaViewMode,
    (@{
      @"padding" : @(ABI45_0_0RNCSafeAreaViewModePadding),
      @"margin" : @(ABI45_0_0RNCSafeAreaViewModeMargin),
    }),
    ABI45_0_0RNCSafeAreaViewModePadding,
    integerValue);

@end
