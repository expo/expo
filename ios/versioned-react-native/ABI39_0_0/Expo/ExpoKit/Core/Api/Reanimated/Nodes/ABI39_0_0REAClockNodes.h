#import "ABI39_0_0REANode.h"

@interface ABI39_0_0REAClockNode : ABI39_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI39_0_0REAClockOpNode : ABI39_0_0REANode
@end

@interface ABI39_0_0REAClockStartNode : ABI39_0_0REAClockOpNode
@end

@interface ABI39_0_0REAClockStopNode : ABI39_0_0REAClockOpNode
@end

@interface ABI39_0_0REAClockTestNode : ABI39_0_0REAClockOpNode
@end
