#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import "ABI39_0_0RNCSafeAreaViewMode.h"

@implementation ABI39_0_0RCTConvert (ABI39_0_0RNCSafeAreaView)

ABI39_0_0RCT_MULTI_ENUM_CONVERTER(ABI39_0_0RNCSafeAreaViewMode, (@{
  @"padding": @(ABI39_0_0RNCSafeAreaViewModePadding),
  @"margin": @(ABI39_0_0RNCSafeAreaViewModeMargin),
}), ABI39_0_0RNCSafeAreaViewModePadding, integerValue);

@end
