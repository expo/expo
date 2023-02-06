#import <ABI48_0_0RNReanimated/ABI48_0_0REANodesManager.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAStyleNode.h>

@implementation ABI48_0_0REAStyleNode {
  NSMutableDictionary<NSString *, ABI48_0_0REANodeID> *_styleConfig;
}

- (instancetype)initWithID:(ABI48_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config;
{
  if ((self = [super initWithID:nodeID config:config])) {
    _styleConfig = config[@"style"];
  }
  return self;
}

- (id)evaluate
{
  NSMutableDictionary *styles = [NSMutableDictionary new];
  for (NSString *prop in _styleConfig) {
    ABI48_0_0REANode *propNode = [self.nodesManager findNodeByID:_styleConfig[prop]];
    styles[prop] = [propNode value];
  }

  return styles;
}

@end
