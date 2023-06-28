#import "ABI49_0_0RNCSafeAreaViewMode.h"
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

@implementation ABI49_0_0RCTConvert (ABI49_0_0RNCSafeAreaView)

ABI49_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI49_0_0RNCSafeAreaViewMode,
    (@{
      @"padding" : @(ABI49_0_0RNCSafeAreaViewModePadding),
      @"margin" : @(ABI49_0_0RNCSafeAreaViewModeMargin),
    }),
    ABI49_0_0RNCSafeAreaViewModePadding,
    integerValue);

@end
