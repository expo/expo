#import "REANode.h"

#import <React/RCTEventDispatcher.h>

@interface REAEventNode : REANode

- (void)processEvent:(id<RCTEvent>)event;

@end
