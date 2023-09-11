#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI49_0_0RNCSafeAreaViewEdgeMode) {
  ABI49_0_0RNCSafeAreaViewEdgeModeOff,
  ABI49_0_0RNCSafeAreaViewEdgeModeAdditive,
  ABI49_0_0RNCSafeAreaViewEdgeModeMaximum
};

@interface ABI49_0_0RCTConvert (ABI49_0_0RNCSafeAreaViewEdgeMode)
+ (ABI49_0_0RNCSafeAreaViewEdgeMode)ABI49_0_0RNCSafeAreaViewEdgeMode:(nullable id)json;
@end
