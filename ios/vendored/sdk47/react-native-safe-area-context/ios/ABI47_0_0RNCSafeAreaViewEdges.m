#import "ABI47_0_0RNCSafeAreaViewEdges.h"
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>

@implementation ABI47_0_0RCTConvert (ABI47_0_0RNCSafeAreaView)

ABI47_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI47_0_0RNCSafeAreaViewEdges,
    (@{
      @"top" : @(ABI47_0_0RNCSafeAreaViewEdgesTop),
      @"right" : @(ABI47_0_0RNCSafeAreaViewEdgesRight),
      @"bottom" : @(ABI47_0_0RNCSafeAreaViewEdgesBottom),
      @"left" : @(ABI47_0_0RNCSafeAreaViewEdgesLeft),
    }),
    ABI47_0_0RNCSafeAreaViewEdgesAll,
    integerValue);

@end
