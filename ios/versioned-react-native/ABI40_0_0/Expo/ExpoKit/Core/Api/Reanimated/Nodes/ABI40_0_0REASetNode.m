#import "ABI40_0_0REASetNode.h"
#import "ABI40_0_0REAUtils.h"
#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import <ABI40_0_0React/ABI40_0_0RCTLog.h>
#import "ABI40_0_0REAValueNode.h"
#import "ABI40_0_0REANodesManager.h"

@implementation ABI40_0_0REASetNode {
  NSNumber *_whatNodeID;
  NSNumber *_valueNodeID;
}

- (instancetype)initWithID:(ABI40_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _whatNodeID = [ABI40_0_0RCTConvert NSNumber:config[@"what"]];
    ABI40_0_0REA_LOG_ERROR_IF_NIL(_whatNodeID, @"Reanimated: First argument passed to set node is either of wrong type or is missing.");
    _valueNodeID = [ABI40_0_0RCTConvert NSNumber:config[@"value"]];
    ABI40_0_0REA_LOG_ERROR_IF_NIL(_valueNodeID, @"Reanimated: Second argument passed to set node is either of wrong type or is missing.");
  }
  return self;
}

- (id)evaluate
{
  NSNumber *newValue = [[self.nodesManager findNodeByID:_valueNodeID] value];
  ABI40_0_0REAValueNode *what = (ABI40_0_0REAValueNode *)[self.nodesManager findNodeByID:_whatNodeID];
  [what setValue:newValue];
  return newValue;
}

@end
