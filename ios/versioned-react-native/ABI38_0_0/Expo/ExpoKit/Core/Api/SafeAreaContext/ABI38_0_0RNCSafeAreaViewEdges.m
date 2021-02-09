#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import "ABI38_0_0RNCSafeAreaViewEdges.h"

@implementation ABI38_0_0RCTConvert (ABI38_0_0RNCSafeAreaView)

ABI38_0_0RCT_MULTI_ENUM_CONVERTER(ABI38_0_0RNCSafeAreaViewEdges, (@{
  @"top": @(ABI38_0_0RNCSafeAreaViewEdgesTop),
  @"right": @(ABI38_0_0RNCSafeAreaViewEdgesRight),
  @"bottom": @(ABI38_0_0RNCSafeAreaViewEdgesBottom),
  @"left": @(ABI38_0_0RNCSafeAreaViewEdgesLeft),
}), ABI38_0_0RNCSafeAreaViewEdgesAll, integerValue);

@end
