#import "ABI42_0_0REANode.h"

@interface ABI42_0_0REAClockNode : ABI42_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI42_0_0REAClockOpNode : ABI42_0_0REANode
@end

@interface ABI42_0_0REAClockStartNode : ABI42_0_0REAClockOpNode
@end

@interface ABI42_0_0REAClockStopNode : ABI42_0_0REAClockOpNode
@end

@interface ABI42_0_0REAClockTestNode : ABI42_0_0REAClockOpNode
@end
