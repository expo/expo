#import <ABI45_0_0RNReanimated/ABI45_0_0REAValueNode.h>

@interface ABI45_0_0REAParamNode : ABI45_0_0REAValueNode

- (void)beginContext:(NSNumber *)ref prevCallID:(NSNumber *)prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end
