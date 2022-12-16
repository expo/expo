#import "DevMenuREAClockNodes.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREAParamNode.h"
#import "DevMenuREAValueNode.h"

@implementation DevMenuREAParamNode {
  NSMutableArray<DevMenuREANodeID> *_argstack;
  NSString *_prevCallID;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _argstack = [NSMutableArray<DevMenuREANodeID> arrayWithCapacity:0];
  }
  return self;
}

- (void)setValue:(NSNumber *)value
{
  DevMenuREANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  NSString *callID = self.updateContext.callID;
  self.updateContext.callID = _prevCallID;
  [(DevMenuREAValueNode *)node setValue:value];
  self.updateContext.callID = callID;
  [self forceUpdateMemoizedValue:value];
}

- (void)beginContext:(NSNumber *)ref prevCallID:(NSString *)prevCallID
{
  _prevCallID = prevCallID;
  [_argstack addObject:ref];
}

- (void)endContext
{
  [_argstack removeLastObject];
}

- (id)evaluate
{
  NSString *callID = self.updateContext.callID;
  self.updateContext.callID = _prevCallID;
  DevMenuREANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  id val = [node value];
  self.updateContext.callID = callID;
  return val;
}

- (void)start
{
  DevMenuREANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[DevMenuREAParamNode class]]) {
    [(DevMenuREAParamNode *)node start];
  } else {
    [(DevMenuREAClockNode *)node start];
  }
}

- (void)stop
{
  DevMenuREANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[DevMenuREAParamNode class]]) {
    [(DevMenuREAParamNode *)node stop];
  } else {
    [(DevMenuREAClockNode *)node stop];
  }
}

- (BOOL)isRunning
{
  DevMenuREANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[DevMenuREAParamNode class]]) {
    return [(DevMenuREAParamNode *)node isRunning];
  }
  return [(DevMenuREAClockNode *)node isRunning];
}

@end
