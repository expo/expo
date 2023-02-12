#import <ABI47_0_0RNReanimated/ABI47_0_0REACondNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REANodesManager.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAUtils.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>

@implementation ABI47_0_0REACondNode {
  NSNumber *_condNodeID;
  NSNumber *_ifBlockID;
  NSNumber *_elseBlockID;
}

- (instancetype)initWithID:(ABI47_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _condNodeID = [ABI47_0_0RCTConvert NSNumber:config[@"cond"]];
    ABI47_0_0REA_LOG_ERROR_IF_NIL(
        _condNodeID, @"Reanimated: First argument passed to cond node is either of wrong type or is missing.");
    _ifBlockID = [ABI47_0_0RCTConvert NSNumber:config[@"ifBlock"]];
    ABI47_0_0REA_LOG_ERROR_IF_NIL(
        _ifBlockID, @"Reanimated: Second argument passed to cond node is either of wrong type or is missing.");
    _elseBlockID = [ABI47_0_0RCTConvert NSNumber:config[@"elseBlock"]];
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
