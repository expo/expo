#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import "ABI43_0_0RNCSafeAreaViewMode.h"

@implementation ABI43_0_0RCTConvert (ABI43_0_0RNCSafeAreaView)

ABI43_0_0RCT_MULTI_ENUM_CONVERTER(ABI43_0_0RNCSafeAreaViewMode, (@{
  @"padding": @(ABI43_0_0RNCSafeAreaViewModePadding),
  @"margin": @(ABI43_0_0RNCSafeAreaViewModeMargin),
}), ABI43_0_0RNCSafeAreaViewModePadding, integerValue);

@end
