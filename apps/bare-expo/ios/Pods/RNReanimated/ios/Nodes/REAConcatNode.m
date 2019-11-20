#import "REAConcatNode.h"
#import "REAValueNode.h"
#import "REANodesManager.h"

@implementation REAConcatNode {
  NSArray<NSNumber *> *_input;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _input = config[@"input"];
  }
  return self;
}

- (id)evaluate
{
  NSMutableString *result = [NSMutableString new];
  for (int i = 0; i < _input.count; i++) {
    NSObject *val = [[self.nodesManager findNodeByID:_input[i]] value];
    if ([val isKindOfClass:[NSNumber class]]) {
      [result appendString:[(NSNumber *)val stringValue]];
    }
    if ([val isKindOfClass:[NSString class]]) {
      [result appendString:val];
    }
  }
  return result;
}

@end
