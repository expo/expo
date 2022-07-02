#import <ABI45_0_0RNReanimated/ABI45_0_0REAClockNodes.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REANodesManager.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAParamNode.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAValueNode.h>

@implementation ABI45_0_0REAParamNode {
  NSMutableArray<ABI45_0_0REANodeID> *_argstack;
  NSString *_prevCallID;
}

- (instancetype)initWithID:(ABI45_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _argstack = [NSMutableArray<ABI45_0_0REANodeID> arrayWithCapacity:0];
  }
  return self;
}

- (void)setValue:(NSNumber *)value
{
  ABI45_0_0REANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  NSString *callID = self.updateContext.callID;
  self.updateContext.callID = _prevCallID;
  [(ABI45_0_0REAValueNode *)node setValue:value];
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
  ABI45_0_0REANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  id val = [node value];
  self.updateContext.callID = callID;
  return val;
}

- (void)start
{
  ABI45_0_0REANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[ABI45_0_0REAParamNode class]]) {
    [(ABI45_0_0REAParamNode *)node start];
  } else {
    [(ABI45_0_0REAClockNode *)node start];
  }
}

- (void)stop
{
  ABI45_0_0REANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[ABI45_0_0REAParamNode class]]) {
    [(ABI45_0_0REAParamNode *)node stop];
  } else {
    [(ABI45_0_0REAClockNode *)node stop];
  }
}

- (BOOL)isRunning
{
  ABI45_0_0REANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[ABI45_0_0REAParamNode class]]) {
    return [(ABI45_0_0REAParamNode *)node isRunning];
  }
  return [(ABI45_0_0REAClockNode *)node isRunning];
}

@end
