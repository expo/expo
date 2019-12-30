#import "ABI36_0_0REAValueNode.h"

@interface ABI36_0_0REAParamNode : ABI36_0_0REAValueNode

- (void)beginContext:(NSNumber*) ref
          prevCallID:(NSNumber*) prevCallID;
-(void) endContext;

@end

