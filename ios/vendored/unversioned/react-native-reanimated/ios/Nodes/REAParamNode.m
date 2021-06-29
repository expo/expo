#import "REAParamNode.h"
#import "REAValueNode.h"
#import "REANodesManager.h"
#import "REAClockNodes.h"

@implementation REAParamNode {
  NSMutableArray<REANodeID> *_argstack;
  NSString *_prevCallID;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _argstack = [NSMutableArray<REANodeID> arrayWithCapacity:0];
  }
  return self;
}

- (void)setValue:(NSNumber *)value
{
  REANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  NSString *callID = self.updateContext.callID;
  self.updateContext.callID = _prevCallID;
  [(REAValueNode*)node setValue:value];
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
  REANode * node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  id val = [node value];
  self.updateContext.callID = callID;
  return val;
}

- (void)start
{
  REANode* node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[REAParamNode class]]) {
    [(REAParamNode* )node start];
  } else {
    [(REAClockNode* )node start];
  }
}

- (void)stop
{
  REANode* node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[REAParamNode class]]) {
    [(REAParamNode* )node stop];
  } else {
    [(REAClockNode* )node stop];
  }
}

- (BOOL)isRunning
{
  REANode* node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  if ([node isKindOfClass:[REAParamNode class]]) {
    return [(REAParamNode* )node isRunning];
  }
  return [(REAClockNode* )node isRunning];
}

@end
