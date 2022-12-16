#import "DevMenuREAAlwaysNode.h"
#import "DevMenuREAModule.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREAStyleNode.h"
#import "DevMenuREAUtils.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>

@implementation DevMenuREAAlwaysNode {
  NSNumber *_nodeToBeEvaluated;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _nodeToBeEvaluated = [RCTConvert NSNumber:config[@"what"]];
    DevMenuREA_LOG_ERROR_IF_NIL(
        _nodeToBeEvaluated, @"DevMenuReanimated: First argument passed to always node is either of wrong type or is missing.");
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
