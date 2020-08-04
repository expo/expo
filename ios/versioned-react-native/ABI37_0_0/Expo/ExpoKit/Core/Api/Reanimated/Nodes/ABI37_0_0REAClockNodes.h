#import "ABI37_0_0REANode.h"

@interface ABI37_0_0REAClockNode : ABI37_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI37_0_0REAClockOpNode : ABI37_0_0REANode
@end

@interface ABI37_0_0REAClockStartNode : ABI37_0_0REAClockOpNode
@end

@interface ABI37_0_0REAClockStopNode : ABI37_0_0REAClockOpNode
@end

@interface ABI37_0_0REAClockTestNode : ABI37_0_0REAClockOpNode
@end
