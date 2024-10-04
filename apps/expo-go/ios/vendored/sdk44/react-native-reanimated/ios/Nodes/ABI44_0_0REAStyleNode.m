#import "ABI44_0_0REAStyleNode.h"

#import "ABI44_0_0REANodesManager.h"

@implementation ABI44_0_0REAStyleNode {
  NSMutableDictionary<NSString *, ABI44_0_0REANodeID> *_styleConfig;
}

- (instancetype)initWithID:(ABI44_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config;
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
    ABI44_0_0REANode *propNode = [self.nodesManager findNodeByID:_styleConfig[prop]];
    styles[prop] = [propNode value];
  }

  return styles;
}

@end
