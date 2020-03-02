#import "ABI37_0_0REAValueNode.h"

@interface ABI37_0_0REAParamNode : ABI37_0_0REAValueNode

- (void)beginContext:(NSNumber*) ref
          prevCallID:(NSNumber*) prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end

