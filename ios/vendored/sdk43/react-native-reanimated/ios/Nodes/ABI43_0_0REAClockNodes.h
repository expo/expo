#import "ABI43_0_0REANode.h"

@interface ABI43_0_0REAClockNode : ABI43_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI43_0_0REAClockOpNode : ABI43_0_0REANode
@end

@interface ABI43_0_0REAClockStartNode : ABI43_0_0REAClockOpNode
@end

@interface ABI43_0_0REAClockStopNode : ABI43_0_0REAClockOpNode
@end

@interface ABI43_0_0REAClockTestNode : ABI43_0_0REAClockOpNode
@end
