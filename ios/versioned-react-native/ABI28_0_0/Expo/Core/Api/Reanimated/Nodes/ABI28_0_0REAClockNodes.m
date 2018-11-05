#import "ABI28_0_0REAClockNodes.h"
#import "ABI28_0_0REANodesManager.h"

@interface ABI28_0_0REAClockNode ()

@property (nonatomic, readonly) BOOL isRunning;
@property (nonatomic) NSNumber *lastTimestampMs;

@end

@implementation ABI28_0_0REAClockNode

- (instancetype)initWithID:(ABI28_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
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
  __weak ABI28_0_0REAClockNode *weakSelf = self;

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

@implementation ABI28_0_0REAClockOpNode {
  NSNumber *_clockNodeID;
}

- (instancetype)initWithID:(ABI28_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _clockNodeID = config[@"clock"];
  }
  return self;
}

- (ABI28_0_0REAClockNode*)clockNode
{
  return (ABI28_0_0REAClockNode*)[self.nodesManager findNodeByID:_clockNodeID];
}

@end

@implementation ABI28_0_0REAClockStartNode

- (id)evaluate
{
  [[self clockNode] start];
  return @(0);
}

@end

@implementation ABI28_0_0REAClockStopNode

- (id)evaluate
{
  [[self clockNode] stop];
  return @(0);
}

@end

@implementation ABI28_0_0REAClockTestNode

- (id)evaluate
{
  return @([self clockNode].isRunning ? 1 : 0);
}

@end
