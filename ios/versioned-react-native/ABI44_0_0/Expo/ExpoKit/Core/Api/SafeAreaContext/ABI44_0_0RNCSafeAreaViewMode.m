#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import "ABI44_0_0RNCSafeAreaViewMode.h"

@implementation ABI44_0_0RCTConvert (ABI44_0_0RNCSafeAreaView)

ABI44_0_0RCT_MULTI_ENUM_CONVERTER(ABI44_0_0RNCSafeAreaViewMode, (@{
  @"padding": @(ABI44_0_0RNCSafeAreaViewModePadding),
  @"margin": @(ABI44_0_0RNCSafeAreaViewModeMargin),
}), ABI44_0_0RNCSafeAreaViewModePadding, integerValue);

@end
