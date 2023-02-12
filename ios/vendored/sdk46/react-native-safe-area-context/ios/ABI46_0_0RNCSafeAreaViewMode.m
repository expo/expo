#import "ABI46_0_0RNCSafeAreaViewMode.h"
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>

@implementation ABI46_0_0RCTConvert (ABI46_0_0RNCSafeAreaView)

ABI46_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI46_0_0RNCSafeAreaViewMode,
    (@{
      @"padding" : @(ABI46_0_0RNCSafeAreaViewModePadding),
      @"margin" : @(ABI46_0_0RNCSafeAreaViewModeMargin),
    }),
    ABI46_0_0RNCSafeAreaViewModePadding,
    integerValue);

@end
