#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import "ABI39_0_0RNCSafeAreaViewEdges.h"

@implementation ABI39_0_0RCTConvert (ABI39_0_0RNCSafeAreaView)

ABI39_0_0RCT_MULTI_ENUM_CONVERTER(ABI39_0_0RNCSafeAreaViewEdges, (@{
  @"top": @(ABI39_0_0RNCSafeAreaViewEdgesTop),
  @"right": @(ABI39_0_0RNCSafeAreaViewEdgesRight),
  @"bottom": @(ABI39_0_0RNCSafeAreaViewEdgesBottom),
  @"left": @(ABI39_0_0RNCSafeAreaViewEdgesLeft),
}), ABI39_0_0RNCSafeAreaViewEdgesAll, integerValue);

@end
