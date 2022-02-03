#import "DevMenuRNCSafeAreaViewLocalData.h"

@implementation DevMenuRNCSafeAreaViewLocalData

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(DevMenuRNCSafeAreaViewMode)mode edges:(DevMenuRNCSafeAreaViewEdges)edges
{
  if (self = [super init]) {
    _insets = insets;
    _mode = mode;
    _edges = edges;
  }

  return self;
}

@end
