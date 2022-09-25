#import <RNReanimated/REANode.h>

@interface REAPropsNode : REANode <REAFinalNode>

- (void)connectToView:(NSNumber *_Nonnull)viewTag viewName:(NSString *_Nonnull)viewName;

- (void)disconnectFromView:(NSNumber *_Nonnull)viewTag;

@end
