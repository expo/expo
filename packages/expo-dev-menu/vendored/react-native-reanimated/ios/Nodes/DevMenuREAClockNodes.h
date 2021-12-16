#import "DevMenuREANode.h"

@interface DevMenuREAClockNode : DevMenuREANode
@property (nonatomic, readonly) BOOL isRunning;
- (void)start;
- (void)stop;
@end

@interface DevMenuREAClockOpNode : DevMenuREANode
@end

@interface DevMenuREAClockStartNode : DevMenuREAClockOpNode
@end

@interface DevMenuREAClockStopNode : DevMenuREAClockOpNode
@end

@interface DevMenuREAClockTestNode : DevMenuREAClockOpNode
@end
