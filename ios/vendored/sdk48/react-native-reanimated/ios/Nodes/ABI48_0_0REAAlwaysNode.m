#import <ABI48_0_0RNReanimated/ABI48_0_0REAAlwaysNode.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAModule.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REANodesManager.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAStyleNode.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAUtils.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>

@implementation ABI48_0_0REAAlwaysNode {
  NSNumber *_nodeToBeEvaluated;
}

- (instancetype)initWithID:(ABI48_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _nodeToBeEvaluated = [ABI48_0_0RCTConvert NSNumber:config[@"what"]];
    ABI48_0_0REA_LOG_ERROR_IF_NIL(
        _nodeToBeEvaluated, @"Reanimated: First argument passed to always node is either of wrong type or is missing.");
  }
  return self;
}

- (id)evaluate
{
  [[self.nodesManager findNodeByID:_nodeToBeEvaluated] value];
  return @(0);
}

- (void)update
{
  [self value];
}

@end
