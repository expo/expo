#import "ABI40_0_0REANode.h"

@interface ABI40_0_0REAClockNode : ABI40_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI40_0_0REAClockOpNode : ABI40_0_0REANode
@end

@interface ABI40_0_0REAClockStartNode : ABI40_0_0REAClockOpNode
@end

@interface ABI40_0_0REAClockStopNode : ABI40_0_0REAClockOpNode
@end

@interface ABI40_0_0REAClockTestNode : ABI40_0_0REAClockOpNode
@end
