#import "ABI30_0_0REACondNode.h"
#import "ABI30_0_0REANodesManager.h"

@implementation ABI30_0_0REACondNode {
  NSNumber *_condNodeID;
  NSNumber *_ifBlockID;
  NSNumber *_elseBlockID;
}

- (instancetype)initWithID:(ABI30_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _condNodeID = config[@"cond"];
    _ifBlockID = config[@"ifBlock"];
    _elseBlockID = config[@"elseBlock"];
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
