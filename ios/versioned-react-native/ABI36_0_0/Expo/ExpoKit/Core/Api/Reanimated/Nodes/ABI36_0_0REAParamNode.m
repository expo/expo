#import "ABI36_0_0REAParamNode.h"
#import "ABI36_0_0REAValueNode.h"
#import "ABI36_0_0REANodesManager.h"

@implementation ABI36_0_0REAParamNode {
  NSMutableArray<ABI36_0_0REANodeID> *_argstack;
  NSString *_prevCallID;
}

- (instancetype)initWithID:(ABI36_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _argstack = [NSMutableArray<ABI36_0_0REANodeID> arrayWithCapacity:0];
  }
  return self;
}

- (void)setValue:(NSNumber *)value
{
  ABI36_0_0REANode *node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  NSString *callID = self.updateContext.callID;
  self.updateContext.callID = _prevCallID;
  [(ABI36_0_0REAValueNode*)node setValue:value];
  self.updateContext.callID = callID;
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
  ABI36_0_0REANode * node = [self.nodesManager findNodeByID:[_argstack lastObject]];
  id val = [node value];
  self.updateContext.callID = callID;
  return val;
}

@end
