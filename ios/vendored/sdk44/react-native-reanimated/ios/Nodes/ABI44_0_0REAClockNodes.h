#import "ABI44_0_0REANode.h"

@interface ABI44_0_0REAClockNode : ABI44_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI44_0_0REAClockOpNode : ABI44_0_0REANode
@end

@interface ABI44_0_0REAClockStartNode : ABI44_0_0REAClockOpNode
@end

@interface ABI44_0_0REAClockStopNode : ABI44_0_0REAClockOpNode
@end

@interface ABI44_0_0REAClockTestNode : ABI44_0_0REAClockOpNode
@end
