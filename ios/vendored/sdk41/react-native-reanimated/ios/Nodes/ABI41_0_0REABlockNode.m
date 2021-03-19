#import "ABI41_0_0REABlockNode.h"
#import "ABI41_0_0REANodesManager.h"

@implementation ABI41_0_0REABlockNode {
  NSArray<NSNumber *> *_block;
}

- (instancetype)initWithID:(ABI41_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
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
