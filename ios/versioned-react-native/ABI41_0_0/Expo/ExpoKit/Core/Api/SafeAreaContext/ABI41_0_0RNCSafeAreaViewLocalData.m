#import "ABI41_0_0RNCSafeAreaViewLocalData.h"

@implementation ABI41_0_0RNCSafeAreaViewLocalData

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(ABI41_0_0RNCSafeAreaViewMode)mode edges:(ABI41_0_0RNCSafeAreaViewEdges)edges
{
  if (self = [super init]) {
    _insets = insets;
    _mode = mode;
    _edges = edges;
  }

  return self;
}

@end
