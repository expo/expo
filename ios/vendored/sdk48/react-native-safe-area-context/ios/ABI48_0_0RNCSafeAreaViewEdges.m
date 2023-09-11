#import "ABI48_0_0RNCSafeAreaViewEdges.h"
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>

@implementation ABI48_0_0RCTConvert (ABI48_0_0RNCSafeAreaView)

ABI48_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI48_0_0RNCSafeAreaViewEdges,
    (@{
      @"top" : @(ABI48_0_0RNCSafeAreaViewEdgesTop),
      @"right" : @(ABI48_0_0RNCSafeAreaViewEdgesRight),
      @"bottom" : @(ABI48_0_0RNCSafeAreaViewEdgesBottom),
      @"left" : @(ABI48_0_0RNCSafeAreaViewEdgesLeft),
    }),
    ABI48_0_0RNCSafeAreaViewEdgesAll,
    integerValue);

@end
