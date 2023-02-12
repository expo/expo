#import "DevMenuREANode.h"

@interface DevMenuREAPropsNode : DevMenuREANode <DevMenuREAFinalNode>

- (void)connectToView:(NSNumber *_Nonnull)viewTag viewName:(NSString *_Nonnull)viewName;

- (void)disconnectFromView:(NSNumber *_Nonnull)viewTag;

@end
