
#import <ABI46_0_0RNReanimated/ABI46_0_0REAFunctionNode.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REANodesManager.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REAParamNode.h>

@implementation ABI46_0_0REAFunctionNode {
  NSNumber *_nodeToBeEvaluated;
}

- (instancetype)initWithID:(ABI46_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _nodeToBeEvaluated = config[@"what"];
  }
  return self;
}

- (id)evaluate
{
  ABI46_0_0REANode *node = [self.nodesManager findNodeByID:_nodeToBeEvaluated];
  return [node value];
}

@end
