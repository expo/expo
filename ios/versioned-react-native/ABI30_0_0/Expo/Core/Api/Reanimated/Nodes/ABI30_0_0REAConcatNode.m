#import "ABI30_0_0REAConcatNode.h"
#import "ABI30_0_0REAValueNode.h"
#import "ABI30_0_0REANodesManager.h"

@implementation ABI30_0_0REAConcatNode {
  NSArray<NSNumber *> *_input;
}

- (instancetype)initWithID:(ABI30_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
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
