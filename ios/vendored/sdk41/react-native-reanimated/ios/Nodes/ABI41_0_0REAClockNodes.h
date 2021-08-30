#import "ABI41_0_0REANode.h"

@interface ABI41_0_0REAClockNode : ABI41_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI41_0_0REAClockOpNode : ABI41_0_0REANode
@end

@interface ABI41_0_0REAClockStartNode : ABI41_0_0REAClockOpNode
@end

@interface ABI41_0_0REAClockStopNode : ABI41_0_0REAClockOpNode
@end

@interface ABI41_0_0REAClockTestNode : ABI41_0_0REAClockOpNode
@end
