#import "DevMenuREANodesManager.h"
#import "DevMenuREASetNode.h"
#import "DevMenuREAUtils.h"
#import "DevMenuREAValueNode.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>

@implementation DevMenuREASetNode {
  NSNumber *_whatNodeID;
  NSNumber *_valueNodeID;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _whatNodeID = [RCTConvert NSNumber:config[@"what"]];
    DevMenuREA_LOG_ERROR_IF_NIL(
        _whatNodeID, @"DevMenuReanimated: First argument passed to set node is either of wrong type or is missing.");
    _valueNodeID = [RCTConvert NSNumber:config[@"value"]];
    DevMenuREA_LOG_ERROR_IF_NIL(
        _valueNodeID, @"DevMenuReanimated: Second argument passed to set node is either of wrong type or is missing.");
  }
  return self;
}

- (id)evaluate
{
  NSNumber *newValue = [[self.nodesManager findNodeByID:_valueNodeID] value];
  DevMenuREAValueNode *what = (DevMenuREAValueNode *)[self.nodesManager findNodeByID:_whatNodeID];
  [what setValue:newValue];
  return newValue;
}

@end
