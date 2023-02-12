#import "DevMenuREAClockNodes.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREAParamNode.h"
#import "DevMenuREAUtils.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>

@interface DevMenuREAClockNode ()

@property (nonatomic) NSNumber *lastTimestampMs;

@end

@implementation DevMenuREAClockNode

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
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
  __weak DevMenuREAClockNode *weakSelf = self;

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

@implementation DevMenuREAClockOpNode {
  NSNumber *_clockNodeID;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _clockNodeID = [RCTConvert NSNumber:config[@"clock"]];
    DevMenuREA_LOG_ERROR_IF_NIL(
        _clockNodeID, @"DevMenuReanimated: First argument passed to clock node is either of wrong type or is missing.");
  }
  return self;
}

- (DevMenuREANode *)clockNode
{
  return (DevMenuREANode *)[self.nodesManager findNodeByID:_clockNodeID];
}

@end

@implementation DevMenuREAClockStartNode

- (id)evaluate
{
  DevMenuREANode *node = [self clockNode];
  if ([node isKindOfClass:[DevMenuREAParamNode class]]) {
    [(DevMenuREAParamNode *)node start];
  } else {
    [(DevMenuREAClockNode *)node start];
  }
  return @(0);
}

@end

@implementation DevMenuREAClockStopNode

- (id)evaluate
{
  DevMenuREANode *node = [self clockNode];
  if ([node isKindOfClass:[DevMenuREAParamNode class]]) {
    [(DevMenuREAParamNode *)node stop];
  } else {
    [(DevMenuREAClockNode *)node stop];
  }
  return @(0);
}

@end

@implementation DevMenuREAClockTestNode

- (id)evaluate
{
  DevMenuREANode *node = [self clockNode];
  if ([node isKindOfClass:[DevMenuREAParamNode class]]) {
    return @(((DevMenuREAParamNode *)node).isRunning ? 1 : 0);
  }
  return @([(DevMenuREAClockNode *)node isRunning] ? 1 : 0);
}

@end
