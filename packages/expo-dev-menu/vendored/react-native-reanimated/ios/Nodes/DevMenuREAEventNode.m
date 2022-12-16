#import "DevMenuREAEventNode.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREAValueNode.h"

@implementation DevMenuREAEventNode {
  NSArray *_argMapping;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _argMapping = config[@"argMapping"];
  }
  return self;
}

- (void)processEvent:(id<RCTEvent>)event
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
        DevMenuREAValueNode *node = (DevMenuREAValueNode *)[self.nodesManager findNodeByID:eventPath[i]];
        [node setValue:value];
      }
    }
  }
}

@end
