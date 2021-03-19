#import "ABI41_0_0REANode.h"

@interface ABI41_0_0REAPropsNode : ABI41_0_0REANode <ABI41_0_0REAFinalNode>

- (void)connectToView:(NSNumber *_Nonnull)viewTag
             viewName:(NSString *_Nonnull)viewName;

- (void)disconnectFromView:(NSNumber *_Nonnull)viewTag;

@end

