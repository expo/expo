#import "ABI39_0_0REAParamNode.h"
#import "ABI39_0_0REAValueNode.h"
#import "ABI39_0_0REANodesManager.h"
#import "ABI39_0_0REAClockNodes.h"

@implementation ABI39_0_0REAParamNode {
  NSMutableArray<ABI39_0_0REANodeID> *_argstack;
  NSString *_prevCallID;
}

- (instancetype)initWithID:(ABI39_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _argstack = [NSMutableArray<ABI39_0_0REANodeID> arrayWithCapacity:0];
  }
  return self;
}

- (void)setValue:(NSNumber *)value
{
  ABI39_0_0REANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  NSString *callID = self.updateContext.callID;
  self.updateContext.callID = _prevCallID;
  [(ABI39_0_0REAValueNode*)node setValue:value];
  self.updateContext.callID = callID;
  [self forceUpdateMemoizedValue:value];
}

- (void)beginContext:(NSNumber*) ref
          prevCallID:(NSString*) prevCallID
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
  ABI39_0_0REANode * node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  id val = [node value];
  self.updateContext.callID = callID;
  return val;
}

- (void)start
{
  ABI39_0_0REANode* node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[ABI39_0_0REAParamNode class]]) {
    [(ABI39_0_0REAParamNode* )node start];
  } else {
    [(ABI39_0_0REAClockNode* )node start];
  }
}

- (void)stop
{
  ABI39_0_0REANode* node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[ABI39_0_0REAParamNode class]]) {
    [(ABI39_0_0REAParamNode* )node stop];
  } else {
    [(ABI39_0_0REAClockNode* )node stop];
  }
}

- (BOOL)isRunning
{
  ABI39_0_0REANode* node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[ABI39_0_0REAParamNode class]]) {
    return [(ABI39_0_0REAParamNode* )node isRunning];
  }
  return [(ABI39_0_0REAClockNode* )node isRunning];
}

@end
