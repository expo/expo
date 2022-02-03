#import "REAAlwaysNode.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import "REAModule.h"
#import "REANodesManager.h"
#import "REAStyleNode.h"
#import "REAUtils.h"

@implementation REAAlwaysNode {
  NSNumber *_nodeToBeEvaluated;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _nodeToBeEvaluated = [RCTConvert NSNumber:config[@"what"]];
    REA_LOG_ERROR_IF_NIL(
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
