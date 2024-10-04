#import "ABI42_0_0REAJSCallNode.h"
#import "ABI42_0_0REANodesManager.h"
#import "ABI42_0_0REAModule.h"

@implementation ABI42_0_0REAJSCallNode {
  NSArray<NSNumber *> *_input;
}

- (instancetype)initWithID:(ABI42_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _input = config[@"input"];
  }
  return self;
}

- (id)evaluate
{
  NSMutableArray *args = [NSMutableArray arrayWithCapacity:_input.count];
  for (NSUInteger i = 0; i < _input.count; i++) {
    args[i] = [[self.nodesManager findNodeByID:_input[i]] value];
  }

  [self.nodesManager.reanimatedModule
   sendEventWithName:@"onReanimatedCall"
   body:@{@"id": self.nodeID, @"args": args }];

  return @(0);
}

@end
