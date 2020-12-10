#import "ABI39_0_0RNCSafeAreaViewLocalData.h"

@implementation ABI39_0_0RNCSafeAreaViewLocalData

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(ABI39_0_0RNCSafeAreaViewMode)mode edges:(ABI39_0_0RNCSafeAreaViewEdges)edges
{
  if (self = [super init]) {
    _insets = insets;
    _mode = mode;
    _edges = edges;
  }

  return self;
}

@end
