#import "REAClockNodes.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import "REANodesManager.h"
#import "REAParamNode.h"
#import "REAUtils.h"

@interface REAClockNode ()

@property (nonatomic) NSNumber *lastTimestampMs;

@end

@implementation REAClockNode

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _isRunning = NO;
  }
  return self;
}

- (void)start
{
  if (_isRunning)
    return;
  _isRunning = YES;

  __block __weak void (^weak_animationClb)(CADisplayLink *displayLink);
  void (^animationClb)(CADisplayLink *displayLink);
  __weak REAClockNode *weakSelf = self;

  weak_animationClb = animationClb = ^(CADisplayLink *displayLink) {
    if (!weakSelf.isRunning)
      return;
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

@implementation REAClockOpNode {
  NSNumber *_clockNodeID;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _clockNodeID = [RCTConvert NSNumber:config[@"clock"]];
    REA_LOG_ERROR_IF_NIL(
        _clockNodeID, @"Reanimated: First argument passed to clock node is either of wrong type or is missing.");
  }
  return self;
}

- (REANode *)clockNode
{
  return (REANode *)[self.nodesManager findNodeByID:_clockNodeID];
}

@end

@implementation REAClockStartNode

- (id)evaluate
{
  REANode *node = [self clockNode];
  if ([node isKindOfClass:[REAParamNode class]]) {
    [(REAParamNode *)node start];
  } else {
    [(REAClockNode *)node start];
  }
  return @(0);
}

@end

@implementation REAClockStopNode

- (id)evaluate
{
  REANode *node = [self clockNode];
  if ([node isKindOfClass:[REAParamNode class]]) {
    [(REAParamNode *)node stop];
  } else {
    [(REAClockNode *)node stop];
  }
  return @(0);
}

@end

@implementation REAClockTestNode

- (id)evaluate
{
  REANode *node = [self clockNode];
  if ([node isKindOfClass:[REAParamNode class]]) {
    return @(((REAParamNode *)node).isRunning ? 1 : 0);
  }
  return @([(REAClockNode *)node isRunning] ? 1 : 0);
}

@end
