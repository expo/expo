#import "RNCSafeAreaViewEdges.h"
#import <React/RCTConvert.h>

@implementation RCTConvert (RNCSafeAreaView)

RCT_MULTI_ENUM_CONVERTER(
    RNCSafeAreaViewEdges,
    (@{
      @"top" : @(RNCSafeAreaViewEdgesTop),
      @"right" : @(RNCSafeAreaViewEdgesRight),
      @"bottom" : @(RNCSafeAreaViewEdgesBottom),
      @"left" : @(RNCSafeAreaViewEdgesLeft),
    }),
    RNCSafeAreaViewEdgesNone,
    integerValue);

@end
