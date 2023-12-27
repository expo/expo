#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import "ABI42_0_0RNCSafeAreaViewEdges.h"

@implementation ABI42_0_0RCTConvert (ABI42_0_0RNCSafeAreaView)

ABI42_0_0RCT_MULTI_ENUM_CONVERTER(ABI42_0_0RNCSafeAreaViewEdges, (@{
  @"top": @(ABI42_0_0RNCSafeAreaViewEdgesTop),
  @"right": @(ABI42_0_0RNCSafeAreaViewEdgesRight),
  @"bottom": @(ABI42_0_0RNCSafeAreaViewEdgesBottom),
  @"left": @(ABI42_0_0RNCSafeAreaViewEdgesLeft),
}), ABI42_0_0RNCSafeAreaViewEdgesAll, integerValue);

@end
