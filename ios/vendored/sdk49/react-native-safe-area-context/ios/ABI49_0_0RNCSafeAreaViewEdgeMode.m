#import "ABI49_0_0RNCSafeAreaViewEdgeMode.h"
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

@implementation ABI49_0_0RCTConvert (ABI49_0_0RNCSafeAreaViewEdgeMode)

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0RNCSafeAreaViewEdgeMode,
    (@{
      @"off" : @(ABI49_0_0RNCSafeAreaViewEdgeModeOff),
      @"additive" : @(ABI49_0_0RNCSafeAreaViewEdgeModeAdditive),
      @"maximum" : @(ABI49_0_0RNCSafeAreaViewEdgeModeMaximum),
    }),
    ABI49_0_0RNCSafeAreaViewEdgeModeOff,
    integerValue);

@end
