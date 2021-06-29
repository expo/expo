#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import "ABI41_0_0RNCSafeAreaViewMode.h"

@implementation ABI41_0_0RCTConvert (ABI41_0_0RNCSafeAreaView)

ABI41_0_0RCT_MULTI_ENUM_CONVERTER(ABI41_0_0RNCSafeAreaViewMode, (@{
  @"padding": @(ABI41_0_0RNCSafeAreaViewModePadding),
  @"margin": @(ABI41_0_0RNCSafeAreaViewModeMargin),
}), ABI41_0_0RNCSafeAreaViewModePadding, integerValue);

@end
