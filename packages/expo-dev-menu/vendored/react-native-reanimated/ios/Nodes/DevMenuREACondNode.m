#import "DevMenuREACondNode.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREAUtils.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>

@implementation DevMenuREACondNode {
  NSNumber *_condNodeID;
  NSNumber *_ifBlockID;
  NSNumber *_elseBlockID;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _condNodeID = [RCTConvert NSNumber:config[@"cond"]];
    DevMenuREA_LOG_ERROR_IF_NIL(
        _condNodeID, @"DevMenuReanimated: First argument passed to cond node is either of wrong type or is missing.");
    _ifBlockID = [RCTConvert NSNumber:config[@"ifBlock"]];
    DevMenuREA_LOG_ERROR_IF_NIL(
        _ifBlockID, @"DevMenuReanimated: Second argument passed to cond node is either of wrong type or is missing.");
    _elseBlockID = [RCTConvert NSNumber:config[@"elseBlock"]];
  }
  return self;
}

- (id)evaluate
{
  id cond = [[self.nodesManager findNodeByID:_condNodeID] value];
  if ([cond doubleValue]) {
    return [[self.nodesManager findNodeByID:_ifBlockID] value];
  }
  return _elseBlockID != nil ? [[self.nodesManager findNodeByID:_elseBlockID] value] : @(0);
}

@end
