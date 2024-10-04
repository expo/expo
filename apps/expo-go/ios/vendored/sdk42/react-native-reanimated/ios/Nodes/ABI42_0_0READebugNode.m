#import "ABI42_0_0READebugNode.h"
#import "ABI42_0_0REAUtils.h"
#import "ABI42_0_0REANodesManager.h"
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>

@implementation ABI42_0_0READebugNode {
  NSNumber *_valueNodeID;
  NSString *_message;
}

- (instancetype)initWithID:(ABI42_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _message = [ABI42_0_0RCTConvert NSString:config[@"message"]];
    _valueNodeID = [ABI42_0_0RCTConvert NSNumber:config[@"value"]];
    ABI42_0_0REA_LOG_ERROR_IF_NIL(_valueNodeID, @"Reanimated: Second argument passed to debug node is either of wrong type or is missing.");
  }
  return self;
}

- (id)evaluate
{
  id value = [[self.nodesManager findNodeByID:_valueNodeID] value];
  NSLog(@"%@ %@", _message, value);
  return value;
}

@end
