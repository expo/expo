#import "RNCSafeAreaViewLocalData.h"

@implementation RNCSafeAreaViewLocalData

- (instancetype)initWithInsets:(UIEdgeInsets)insets edges:(RNCSafeAreaViewEdges)edges
{
  if (self = [super init]) {
    _insets = insets;
    _edges = edges;
  }

  return self;
}

@end
