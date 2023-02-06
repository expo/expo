#import <ABI48_0_0RNReanimated/ABI48_0_0REAValueNode.h>

@interface ABI48_0_0REAParamNode : ABI48_0_0REAValueNode

- (void)beginContext:(NSNumber *)ref prevCallID:(NSNumber *)prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end
