#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import "ABI42_0_0RNCSafeAreaViewMode.h"

@implementation ABI42_0_0RCTConvert (ABI42_0_0RNCSafeAreaView)

ABI42_0_0RCT_MULTI_ENUM_CONVERTER(ABI42_0_0RNCSafeAreaViewMode, (@{
  @"padding": @(ABI42_0_0RNCSafeAreaViewModePadding),
  @"margin": @(ABI42_0_0RNCSafeAreaViewModeMargin),
}), ABI42_0_0RNCSafeAreaViewModePadding, integerValue);

@end
