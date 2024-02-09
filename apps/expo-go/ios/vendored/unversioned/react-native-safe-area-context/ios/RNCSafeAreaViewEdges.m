#import "RNCSafeAreaViewEdges.h"
#import <React/RCTConvert.h>
#import "RNCSafeAreaViewEdgeMode.h"

RNCSafeAreaViewEdges RNCSafeAreaViewEdgesMake(
    RNCSafeAreaViewEdgeMode top,
    RNCSafeAreaViewEdgeMode right,
    RNCSafeAreaViewEdgeMode bottom,
    RNCSafeAreaViewEdgeMode left)
{
  RNCSafeAreaViewEdges edges;
  edges.top = top;
  edges.left = left;
  edges.bottom = bottom;
  edges.right = right;
  return edges;
}

RNCSafeAreaViewEdges RNCSafeAreaViewEdgesMakeString(NSString *top, NSString *right, NSString *bottom, NSString *left)
{
  RNCSafeAreaViewEdges edges;
  edges.top = [RCTConvert RNCSafeAreaViewEdgeMode:top];
  edges.right = [RCTConvert RNCSafeAreaViewEdgeMode:right];
  edges.bottom = [RCTConvert RNCSafeAreaViewEdgeMode:bottom];
  edges.left = [RCTConvert RNCSafeAreaViewEdgeMode:left];
  return edges;
}

@implementation RCTConvert (RNCSafeAreaViewEdges)

RCT_CUSTOM_CONVERTER(
    RNCSafeAreaViewEdges,
    RNCSafeAreaViewEdges,
    RNCSafeAreaViewEdgesMakeString(json[@"top"], json[@"right"], json[@"bottom"], json[@"left"]))

@end
