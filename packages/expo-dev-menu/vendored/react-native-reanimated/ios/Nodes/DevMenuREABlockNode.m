#import "DevMenuREABlockNode.h"
#import "DevMenuREANodesManager.h"

@implementation DevMenuREABlockNode {
  NSArray<NSNumber *> *_block;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _block = config[@"block"];
  }
  return self;
}

- (id)evaluate
{
  id result;
  for (NSNumber *inputID in _block) {
    result = [[self.nodesManager findNodeByID:inputID] value];
  }
  return result;
}

@end
