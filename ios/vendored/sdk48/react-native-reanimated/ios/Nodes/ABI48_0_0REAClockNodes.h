#import <ABI48_0_0RNReanimated/ABI48_0_0REANode.h>

@interface ABI48_0_0REAClockNode : ABI48_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI48_0_0REAClockOpNode : ABI48_0_0REANode
@end

@interface ABI48_0_0REAClockStartNode : ABI48_0_0REAClockOpNode
@end

@interface ABI48_0_0REAClockStopNode : ABI48_0_0REAClockOpNode
@end

@interface ABI48_0_0REAClockTestNode : ABI48_0_0REAClockOpNode
@end
