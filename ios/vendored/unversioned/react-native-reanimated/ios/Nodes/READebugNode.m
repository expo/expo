#import <RNReanimated/READebugNode.h>
#import <RNReanimated/REANodesManager.h>
#import <RNReanimated/REAUtils.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>

@implementation READebugNode {
  NSNumber *_valueNodeID;
  NSString *_message;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _message = [RCTConvert NSString:config[@"message"]];
    _valueNodeID = [RCTConvert NSNumber:config[@"value"]];
    REA_LOG_ERROR_IF_NIL(
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
