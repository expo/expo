#import "ABI48_0_0RNCSafeAreaViewMode.h"
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>

@implementation ABI48_0_0RCTConvert (ABI48_0_0RNCSafeAreaView)

ABI48_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI48_0_0RNCSafeAreaViewMode,
    (@{
      @"padding" : @(ABI48_0_0RNCSafeAreaViewModePadding),
      @"margin" : @(ABI48_0_0RNCSafeAreaViewModeMargin),
    }),
    ABI48_0_0RNCSafeAreaViewModePadding,
    integerValue);

@end
