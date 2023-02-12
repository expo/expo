#import "ABI48_0_0RNCSafeAreaViewLocalData.h"

@implementation ABI48_0_0RNCSafeAreaViewLocalData

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(ABI48_0_0RNCSafeAreaViewMode)mode edges:(ABI48_0_0RNCSafeAreaViewEdges)edges
{
  if (self = [super init]) {
    _insets = insets;
    _mode = mode;
    _edges = edges;
  }

  return self;
}

@end
