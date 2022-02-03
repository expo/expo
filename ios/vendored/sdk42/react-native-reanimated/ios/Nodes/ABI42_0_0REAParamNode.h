#import "ABI42_0_0REAValueNode.h"

@interface ABI42_0_0REAParamNode : ABI42_0_0REAValueNode

- (void)beginContext:(NSNumber*) ref
          prevCallID:(NSNumber*) prevCallID;
- (void)endContext;
- (void)start;
- (void)stop;
- (BOOL)isRunning;
@end

