#import <ABI46_0_0RNReanimated/ABI46_0_0REANode.h>

@interface ABI46_0_0REAClockNode : ABI46_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI46_0_0REAClockOpNode : ABI46_0_0REANode
@end

@interface ABI46_0_0REAClockStartNode : ABI46_0_0REAClockOpNode
@end

@interface ABI46_0_0REAClockStopNode : ABI46_0_0REAClockOpNode
@end

@interface ABI46_0_0REAClockTestNode : ABI46_0_0REAClockOpNode
@end
