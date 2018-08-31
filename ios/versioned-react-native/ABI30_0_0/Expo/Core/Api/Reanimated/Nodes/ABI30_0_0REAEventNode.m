#import "ABI30_0_0REAEventNode.h"
#import "ABI30_0_0REANodesManager.h"
#import "ABI30_0_0REAValueNode.h"

@implementation ABI30_0_0REAEventNode {
  NSArray *_argMapping;
}

- (instancetype)initWithID:(ABI30_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _argMapping = config[@"argMapping"];
  }
  return self;
}

- (void)processEvent:(id<ABI30_0_0RCTEvent>)event
{
  NSArray *args = event.arguments;
  // argMapping is an array of eventPaths, each even path ends with a target node ID
  for (NSArray *eventPath in _argMapping) {
    // Supported events args are in the following order: viewTag, eventName, eventData.
    id value = args[2];
    for (NSUInteger i = 0; i < eventPath.count; i++) {
      if (i < eventPath.count - 1) {
        value = [value valueForKey:eventPath[i]];
      } else {
        ABI30_0_0REAValueNode *node = (ABI30_0_0REAValueNode *)[self.nodesManager findNodeByID:eventPath[i]];
        [node setValue:value];
      }
    }
  }
}

@end
