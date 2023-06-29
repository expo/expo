#import <Foundation/Foundation.h>
#import "ABI49_0_0RNCSafeAreaViewEdgeMode.h"

typedef struct ABI49_0_0RNCSafeAreaViewEdges {
  ABI49_0_0RNCSafeAreaViewEdgeMode top;
  ABI49_0_0RNCSafeAreaViewEdgeMode right;
  ABI49_0_0RNCSafeAreaViewEdgeMode bottom;
  ABI49_0_0RNCSafeAreaViewEdgeMode left;
} ABI49_0_0RNCSafeAreaViewEdges;

ABI49_0_0RNCSafeAreaViewEdges ABI49_0_0RNCSafeAreaViewEdgesMake(
    ABI49_0_0RNCSafeAreaViewEdgeMode top,
    ABI49_0_0RNCSafeAreaViewEdgeMode right,
    ABI49_0_0RNCSafeAreaViewEdgeMode bottom,
    ABI49_0_0RNCSafeAreaViewEdgeMode left);
