#import "ABI46_0_0RNCSafeAreaViewEdges.h"
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>

@implementation ABI46_0_0RCTConvert (ABI46_0_0RNCSafeAreaView)

ABI46_0_0RCT_MULTI_ENUM_CONVERTER(
    ABI46_0_0RNCSafeAreaViewEdges,
    (@{
      @"top" : @(ABI46_0_0RNCSafeAreaViewEdgesTop),
      @"right" : @(ABI46_0_0RNCSafeAreaViewEdgesRight),
      @"bottom" : @(ABI46_0_0RNCSafeAreaViewEdgesBottom),
      @"left" : @(ABI46_0_0RNCSafeAreaViewEdgesLeft),
    }),
    ABI46_0_0RNCSafeAreaViewEdgesAll,
    integerValue);

@end
