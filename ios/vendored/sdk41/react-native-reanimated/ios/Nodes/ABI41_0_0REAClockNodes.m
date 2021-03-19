#import "ABI41_0_0REAClockNodes.h"
#import "ABI41_0_0REAUtils.h"
#import "ABI41_0_0REANodesManager.h"
#import "ABI41_0_0REAParamNode.h"
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

@interface ABI41_0_0REAClockNode ()

@property (nonatomic) NSNumber *lastTimestampMs;

@end

@implementation ABI41_0_0REAClockNode

- (instancetype)initWithID:(ABI41_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _isRunning = NO;
  }
  return self;
}

- (void)start
{
  if (_isRunning) return;
  _isRunning = YES;

  __block __weak void (^weak_animationClb)(CADisplayLink *displayLink);
  void (^animationClb)(CADisplayLink *displayLink);
  __weak ABI41_0_0REAClockNode *weakSelf = self;

  weak_animationClb = animationClb = ^(CADisplayLink *displayLink) {
    if (!weakSelf.isRunning) return;
    [weakSelf markUpdated];
    [weakSelf.nodesManager postOnAnimation:weak_animationClb];
  };

  [self.nodesManager postOnAnimation:animationClb];
}

- (void)stop
{
  _isRunning = false;
}

- (id)evaluate
{
  return @(self.nodesManager.currentAnimationTimestamp * 1000.);
}

@end

@implementation ABI41_0_0REAClockOpNode {
  NSNumber *_clockNodeID;
}

- (instancetype)initWithID:(ABI41_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _clockNodeID = [ABI41_0_0RCTConvert NSNumber:config[@"clock"]];
    ABI41_0_0REA_LOG_ERROR_IF_NIL(_clockNodeID, @"Reanimated: First argument passed to clock node is either of wrong type or is missing.");
  }
  return self;
}

- (ABI41_0_0REANode*)clockNode
{
  return (ABI41_0_0REANode*)[self.nodesManager findNodeByID:_clockNodeID];
}

@end

@implementation ABI41_0_0REAClockStartNode

- (id)evaluate
{
  ABI41_0_0REANode* node = [self clockNode];
  if ([node isKindOfClass:[ABI41_0_0REAParamNode class]]) {
    [(ABI41_0_0REAParamNode* )node start];
  } else {
    [(ABI41_0_0REAClockNode* )node start];
  }
  return @(0);
}

@end

@implementation ABI41_0_0REAClockStopNode

- (id)evaluate
{
  ABI41_0_0REANode* node = [self clockNode];
  if ([node isKindOfClass:[ABI41_0_0REAParamNode class]]) {
    [(ABI41_0_0REAParamNode* )node stop];
  } else {
    [(ABI41_0_0REAClockNode* )node stop];
  }
  return @(0);
}


@end

@implementation ABI41_0_0REAClockTestNode

- (id)evaluate
{
  ABI41_0_0REANode* node = [self clockNode];
  if ([node isKindOfClass:[ABI41_0_0REAParamNode class]]) {
    return @(((ABI41_0_0REAParamNode* )node).isRunning ? 1 : 0);
  }
  return @([(ABI41_0_0REAClockNode* )node isRunning] ? 1 : 0);
}

@end
