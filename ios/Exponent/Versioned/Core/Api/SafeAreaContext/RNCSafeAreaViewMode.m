#import <React/RCTConvert.h>
#import "RNCSafeAreaViewMode.h"

@implementation RCTConvert (RNCSafeAreaView)

RCT_MULTI_ENUM_CONVERTER(RNCSafeAreaViewMode, (@{
  @"padding": @(RNCSafeAreaViewModePadding),
  @"margin": @(RNCSafeAreaViewModeMargin),
}), RNCSafeAreaViewModePadding, integerValue);

@end
