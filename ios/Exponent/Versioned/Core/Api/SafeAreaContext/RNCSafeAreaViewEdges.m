#import <React/RCTConvert.h>
#import "RNCSafeAreaViewEdges.h"

@implementation RCTConvert (RNCSafeAreaView)

RCT_MULTI_ENUM_CONVERTER(RNCSafeAreaViewEdges, (@{
  @"top": @(RNCSafeAreaViewEdgesTop),
  @"right": @(RNCSafeAreaViewEdgesRight),
  @"bottom": @(RNCSafeAreaViewEdgesBottom),
  @"left": @(RNCSafeAreaViewEdgesLeft),
}), RNCSafeAreaViewEdgesAll, integerValue);

@end
