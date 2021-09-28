#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import "ABI43_0_0RNCSafeAreaViewEdges.h"

@implementation ABI43_0_0RCTConvert (ABI43_0_0RNCSafeAreaView)

ABI43_0_0RCT_MULTI_ENUM_CONVERTER(ABI43_0_0RNCSafeAreaViewEdges, (@{
  @"top": @(ABI43_0_0RNCSafeAreaViewEdgesTop),
  @"right": @(ABI43_0_0RNCSafeAreaViewEdgesRight),
  @"bottom": @(ABI43_0_0RNCSafeAreaViewEdgesBottom),
  @"left": @(ABI43_0_0RNCSafeAreaViewEdgesLeft),
}), ABI43_0_0RNCSafeAreaViewEdgesAll, integerValue);

@end
