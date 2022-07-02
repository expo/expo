
#import <RNReanimated/REAFunctionNode.h>
#import <RNReanimated/REANodesManager.h>
#import <RNReanimated/REAParamNode.h>

@implementation REAFunctionNode {
  NSNumber *_nodeToBeEvaluated;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _nodeToBeEvaluated = config[@"what"];
  }
  return self;
}

- (id)evaluate
{
  REANode *node = [self.nodesManager findNodeByID:_nodeToBeEvaluated];
  return [node value];
}

@end
