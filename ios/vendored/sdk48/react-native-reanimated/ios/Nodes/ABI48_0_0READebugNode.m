#import <ABI48_0_0RNReanimated/ABI48_0_0READebugNode.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REANodesManager.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAUtils.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>

@implementation ABI48_0_0READebugNode {
  NSNumber *_valueNodeID;
  NSString *_message;
}

- (instancetype)initWithID:(ABI48_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _message = [ABI48_0_0RCTConvert NSString:config[@"message"]];
    _valueNodeID = [ABI48_0_0RCTConvert NSNumber:config[@"value"]];
    ABI48_0_0REA_LOG_ERROR_IF_NIL(
        _valueNodeID, @"Reanimated: Second argument passed to debug node is either of wrong type or is missing.");
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
