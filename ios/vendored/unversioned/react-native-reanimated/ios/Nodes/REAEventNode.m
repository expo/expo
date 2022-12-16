#import <RNReanimated/REAEventNode.h>
#import <RNReanimated/REANodesManager.h>
#import <RNReanimated/REAValueNode.h>

@implementation REAEventNode {
  NSArray *_argMapping;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
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
        REAValueNode *node = (REAValueNode *)[self.nodesManager findNodeByID:eventPath[i]];
        [node setValue:value];
      }
    }
  }
}

@end
