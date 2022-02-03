#import "ABI44_0_0REAValueNode.h"

@interface ABI44_0_0REAParamNode : ABI44_0_0REAValueNode

- (void)beginContext:(NSNumber *)ref prevCallID:(NSNumber *)prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end
