#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import "ABI38_0_0RNCSafeAreaViewMode.h"

@implementation ABI38_0_0RCTConvert (ABI38_0_0RNCSafeAreaView)

ABI38_0_0RCT_MULTI_ENUM_CONVERTER(ABI38_0_0RNCSafeAreaViewMode, (@{
  @"padding": @(ABI38_0_0RNCSafeAreaViewModePadding),
  @"margin": @(ABI38_0_0RNCSafeAreaViewModeMargin),
}), ABI38_0_0RNCSafeAreaViewModePadding, integerValue);

@end
