#import "ABI49_0_0RNCSafeAreaViewEdges.h"
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import "ABI49_0_0RNCSafeAreaViewEdgeMode.h"

ABI49_0_0RNCSafeAreaViewEdges ABI49_0_0RNCSafeAreaViewEdgesMake(
    ABI49_0_0RNCSafeAreaViewEdgeMode top,
    ABI49_0_0RNCSafeAreaViewEdgeMode right,
    ABI49_0_0RNCSafeAreaViewEdgeMode bottom,
    ABI49_0_0RNCSafeAreaViewEdgeMode left)
{
  ABI49_0_0RNCSafeAreaViewEdges edges;
  edges.top = top;
  edges.left = left;
  edges.bottom = bottom;
  edges.right = right;
  return edges;
}

ABI49_0_0RNCSafeAreaViewEdges ABI49_0_0RNCSafeAreaViewEdgesMakeString(NSString *top, NSString *right, NSString *bottom, NSString *left)
{
  ABI49_0_0RNCSafeAreaViewEdges edges;
  edges.top = [ABI49_0_0RCTConvert ABI49_0_0RNCSafeAreaViewEdgeMode:top];
  edges.right = [ABI49_0_0RCTConvert ABI49_0_0RNCSafeAreaViewEdgeMode:right];
  edges.bottom = [ABI49_0_0RCTConvert ABI49_0_0RNCSafeAreaViewEdgeMode:bottom];
  edges.left = [ABI49_0_0RCTConvert ABI49_0_0RNCSafeAreaViewEdgeMode:left];
  return edges;
}

@implementation ABI49_0_0RCTConvert (ABI49_0_0RNCSafeAreaViewEdges)

ABI49_0_0RCT_CUSTOM_CONVERTER(
    ABI49_0_0RNCSafeAreaViewEdges,
    ABI49_0_0RNCSafeAreaViewEdges,
    ABI49_0_0RNCSafeAreaViewEdgesMakeString(json[@"top"], json[@"right"], json[@"bottom"], json[@"left"]))

@end
