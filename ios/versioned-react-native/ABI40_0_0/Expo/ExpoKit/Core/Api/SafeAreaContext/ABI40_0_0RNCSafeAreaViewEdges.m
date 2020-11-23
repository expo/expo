#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import "ABI40_0_0RNCSafeAreaViewEdges.h"

@implementation ABI40_0_0RCTConvert (ABI40_0_0RNCSafeAreaView)

ABI40_0_0RCT_MULTI_ENUM_CONVERTER(ABI40_0_0RNCSafeAreaViewEdges, (@{
  @"top": @(ABI40_0_0RNCSafeAreaViewEdgesTop),
  @"right": @(ABI40_0_0RNCSafeAreaViewEdgesRight),
  @"bottom": @(ABI40_0_0RNCSafeAreaViewEdgesBottom),
  @"left": @(ABI40_0_0RNCSafeAreaViewEdgesLeft),
}), ABI40_0_0RNCSafeAreaViewEdgesAll, integerValue);

@end
