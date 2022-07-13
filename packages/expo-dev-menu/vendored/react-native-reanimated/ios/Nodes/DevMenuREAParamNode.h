#import "DevMenuREAValueNode.h"

@interface DevMenuREAParamNode : DevMenuREAValueNode

- (void)beginContext:(NSNumber *)ref prevCallID:(NSNumber *)prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end
