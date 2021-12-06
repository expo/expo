#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import "ABI44_0_0RNCSafeAreaViewEdges.h"

@implementation ABI44_0_0RCTConvert (ABI44_0_0RNCSafeAreaView)

ABI44_0_0RCT_MULTI_ENUM_CONVERTER(ABI44_0_0RNCSafeAreaViewEdges, (@{
  @"top": @(ABI44_0_0RNCSafeAreaViewEdgesTop),
  @"right": @(ABI44_0_0RNCSafeAreaViewEdgesRight),
  @"bottom": @(ABI44_0_0RNCSafeAreaViewEdgesBottom),
  @"left": @(ABI44_0_0RNCSafeAreaViewEdgesLeft),
}), ABI44_0_0RNCSafeAreaViewEdgesAll, integerValue);

@end
