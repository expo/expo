

#import "REACallFuncNode.h"
#import "REAFunctionNode.h"
#import "REANodesManager.h"
#import "REAParamNode.h"
#import "REAUtils.h"

@implementation REACallFuncNode {
  NSNumber *_whatNodeID;
  NSArray<NSNumber *> *_args;
  NSArray<NSNumber *> *_params;
  NSString *_prevCallID;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _whatNodeID = config[@"what"];
    REA_LOG_ERROR_IF_NIL(
        _whatNodeID, @"Reanimated: First argument passed to callFunc node is either of wrong type or is missing.");
    _args = config[@"args"];
    _params = config[@"params"];
    _prevCallID = NULL;
  }
  return self;
}

- (void)beginContext
{
  // To ensure that functions can be called multiple times in the same animation frame
  // (functions might have different parameters and might be called multiple times)
  // we inform the current update context about where we are called from by setting the
  // current call id - this will ensure that memoization is correct for function nodes.
  _prevCallID = self.updateContext.callID;
  self.updateContext.callID =
      [NSString stringWithFormat:@"%@/%@", self.updateContext.callID, [self.nodeID stringValue]];

  // A CallFuncNode has a reference to a function node which holds the node graph that should
  // be updated. A Function node has a list of ParamNodes which are basically nodes that can
  // reference other nodes. When we start a new function call we update the parameter nodes
  // with the current arguments:
  for (NSUInteger i = 0; i < _params.count; i++) {
    NSNumber *paramID = [_params objectAtIndex:i];
    REAParamNode *param = (REAParamNode *)[self.nodesManager findNodeByID:paramID];
    [param beginContext:_args[i] prevCallID:_prevCallID];
  }
}

- (void)endContext
{
  for (NSUInteger i = 0; i < _params.count; i++) {
    NSNumber *paramID = [_params objectAtIndex:i];
    REAParamNode *param = (REAParamNode *)[self.nodesManager findNodeByID:paramID];
    [param endContext];
  }
  self.updateContext.callID = _prevCallID;
}

- (id)evaluate
{
  [self beginContext];
  REAFunctionNode *what = (REAFunctionNode *)[self.nodesManager findNodeByID:_whatNodeID];
  NSNumber *newValue = [what value];
  [self endContext];
  return newValue;
}

@end
