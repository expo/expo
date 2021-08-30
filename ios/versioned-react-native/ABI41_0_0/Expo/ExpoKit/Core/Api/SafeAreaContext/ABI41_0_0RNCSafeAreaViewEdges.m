#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import "ABI41_0_0RNCSafeAreaViewEdges.h"

@implementation ABI41_0_0RCTConvert (ABI41_0_0RNCSafeAreaView)

ABI41_0_0RCT_MULTI_ENUM_CONVERTER(ABI41_0_0RNCSafeAreaViewEdges, (@{
  @"top": @(ABI41_0_0RNCSafeAreaViewEdgesTop),
  @"right": @(ABI41_0_0RNCSafeAreaViewEdgesRight),
  @"bottom": @(ABI41_0_0RNCSafeAreaViewEdgesBottom),
  @"left": @(ABI41_0_0RNCSafeAreaViewEdgesLeft),
}), ABI41_0_0RNCSafeAreaViewEdgesAll, integerValue);

@end
