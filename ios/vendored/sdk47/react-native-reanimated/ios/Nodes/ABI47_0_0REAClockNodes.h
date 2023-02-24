#import <ABI47_0_0RNReanimated/ABI47_0_0REANode.h>

@interface ABI47_0_0REAClockNode : ABI47_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI47_0_0REAClockOpNode : ABI47_0_0REANode
@end

@interface ABI47_0_0REAClockStartNode : ABI47_0_0REAClockOpNode
@end

@interface ABI47_0_0REAClockStopNode : ABI47_0_0REAClockOpNode
@end

@interface ABI47_0_0REAClockTestNode : ABI47_0_0REAClockOpNode
@end
