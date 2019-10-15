#import "REAValueNode.h"

@interface REAParamNode : REAValueNode

- (void)beginContext:(NSNumber*) ref
          prevCallID:(NSNumber*) prevCallID;
-(void) endContext;

@end

