#import <ABI47_0_0RNReanimated/ABI47_0_0REAValueNode.h>

@interface ABI47_0_0REAParamNode : ABI47_0_0REAValueNode

- (void)beginContext:(NSNumber *)ref prevCallID:(NSNumber *)prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end
