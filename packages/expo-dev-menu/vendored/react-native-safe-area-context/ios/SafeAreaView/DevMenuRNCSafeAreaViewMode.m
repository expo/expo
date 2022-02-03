#import <React/RCTConvert.h>
#import "DevMenuRNCSafeAreaViewMode.h"

@implementation RCTConvert (DevMenuRNCSafeAreaView)

RCT_MULTI_ENUM_CONVERTER(DevMenuRNCSafeAreaViewMode, (@{
  @"padding": @(DevMenuRNCSafeAreaViewModePadding),
  @"margin": @(DevMenuRNCSafeAreaViewModeMargin),
}), DevMenuRNCSafeAreaViewModePadding, integerValue);

@end
