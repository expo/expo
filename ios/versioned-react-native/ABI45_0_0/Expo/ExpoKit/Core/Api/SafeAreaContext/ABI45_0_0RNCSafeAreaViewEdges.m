#import "ABI45_0_0RNCSafeAreaViewEdges.h"
#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>

@implementation ABI45_0_0RCTConvert (ABI45_0_0RNCSafeAreaView)

ABI45_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI45_0_0RNCSafeAreaViewEdges,
    (@{
      @"top" : @(ABI45_0_0RNCSafeAreaViewEdgesTop),
      @"right" : @(ABI45_0_0RNCSafeAreaViewEdgesRight),
      @"bottom" : @(ABI45_0_0RNCSafeAreaViewEdgesBottom),
      @"left" : @(ABI45_0_0RNCSafeAreaViewEdgesLeft),
    }),
    ABI45_0_0RNCSafeAreaViewEdgesAll,
    integerValue);

@end
