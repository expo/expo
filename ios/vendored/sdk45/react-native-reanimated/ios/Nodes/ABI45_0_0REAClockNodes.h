#import <ABI45_0_0RNReanimated/ABI45_0_0REANode.h>

@interface ABI45_0_0REAClockNode : ABI45_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI45_0_0REAClockOpNode : ABI45_0_0REANode
@end

@interface ABI45_0_0REAClockStartNode : ABI45_0_0REAClockOpNode
@end

@interface ABI45_0_0REAClockStopNode : ABI45_0_0REAClockOpNode
@end

@interface ABI45_0_0REAClockTestNode : ABI45_0_0REAClockOpNode
@end
