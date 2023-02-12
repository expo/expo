#import <ABI46_0_0RNReanimated/ABI46_0_0REAValueNode.h>

@interface ABI46_0_0REAParamNode : ABI46_0_0REAValueNode

- (void)beginContext:(NSNumber *)ref prevCallID:(NSNumber *)prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end
