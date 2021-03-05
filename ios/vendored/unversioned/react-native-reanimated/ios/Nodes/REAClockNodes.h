#import "REANode.h"

@interface REAClockNode : REANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface REAClockOpNode : REANode
@end

@interface REAClockStartNode : REAClockOpNode
@end

@interface REAClockStopNode : REAClockOpNode
@end

@interface REAClockTestNode : REAClockOpNode
@end
