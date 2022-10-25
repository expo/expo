#import "ABI47_0_0RNCSafeAreaViewMode.h"
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>

@implementation ABI47_0_0RCTConvert (ABI47_0_0RNCSafeAreaView)

ABI47_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI47_0_0RNCSafeAreaViewMode,
    (@{
      @"padding" : @(ABI47_0_0RNCSafeAreaViewModePadding),
      @"margin" : @(ABI47_0_0RNCSafeAreaViewModeMargin),
    }),
    ABI47_0_0RNCSafeAreaViewModePadding,
    integerValue);

@end
