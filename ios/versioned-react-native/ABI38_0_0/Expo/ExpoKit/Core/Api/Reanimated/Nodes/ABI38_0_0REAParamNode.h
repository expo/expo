#import "ABI38_0_0REAValueNode.h"

@interface ABI38_0_0REAParamNode : ABI38_0_0REAValueNode

- (void)beginContext:(NSNumber*) ref
          prevCallID:(NSNumber*) prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end

