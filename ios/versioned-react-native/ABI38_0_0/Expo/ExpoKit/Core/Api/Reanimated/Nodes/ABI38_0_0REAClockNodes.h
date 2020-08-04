#import "ABI38_0_0REANode.h"

@interface ABI38_0_0REAClockNode : ABI38_0_0REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface ABI38_0_0REAClockOpNode : ABI38_0_0REANode
@end

@interface ABI38_0_0REAClockStartNode : ABI38_0_0REAClockOpNode
@end

@interface ABI38_0_0REAClockStopNode : ABI38_0_0REAClockOpNode
@end

@interface ABI38_0_0REAClockTestNode : ABI38_0_0REAClockOpNode
@end
