#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import "ABI40_0_0RNCSafeAreaViewMode.h"

@implementation ABI40_0_0RCTConvert (ABI40_0_0RNCSafeAreaView)

ABI40_0_0RCT_MULTI_ENUM_CONVERTER(ABI40_0_0RNCSafeAreaViewMode, (@{
  @"padding": @(ABI40_0_0RNCSafeAreaViewModePadding),
  @"margin": @(ABI40_0_0RNCSafeAreaViewModeMargin),
}), ABI40_0_0RNCSafeAreaViewModePadding, integerValue);

@end
