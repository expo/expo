#include <tgmath.h>

#import "ABI29_0_0REAOperatorNode.h"
#import "ABI29_0_0REANodesManager.h"

typedef id (^ABI29_0_0REAOperatorBlock)(NSArray<ABI29_0_0REANode *> *inputNodes);

#define ABI29_0_0REA_REDUCE(OP) ^(NSArray<ABI29_0_0REANode *> *inputNodes) { \
CGFloat acc = [[inputNodes[0] value] doubleValue]; \
for (NSUInteger i = 1; i < inputNodes.count; i++) { \
  CGFloat a = acc, b = [[inputNodes[i] value] doubleValue]; \
  acc = OP; \
} \
return @(acc); \
}

#define ABI29_0_0REA_SINGLE(OP) ^(NSArray<ABI29_0_0REANode *> *inputNodes) { \
CGFloat a = [[inputNodes[0] value] doubleValue]; \
return @(OP); \
}

#define ABI29_0_0REA_INFIX(OP) ^(NSArray<ABI29_0_0REANode *> *inputNodes) { \
CGFloat a = [[inputNodes[0] value] doubleValue]; \
CGFloat b = [[inputNodes[1] value] doubleValue]; \
return @(OP); \
}

@implementation ABI29_0_0REAOperatorNode {
  NSArray<NSNumber *> *_input;
  NSMutableArray<ABI29_0_0REANode *> *_inputNodes;
  ABI29_0_0REAOperatorBlock _op;
}

- (instancetype)initWithID:(ABI29_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  static NSDictionary *OPS;
  static dispatch_once_t opsToken;
  dispatch_once(&opsToken, ^{
    OPS = @{
            // arithmetic
            @"add": ABI29_0_0REA_REDUCE(a + b),
            @"sub": ABI29_0_0REA_REDUCE(a - b),
            @"multiply": ABI29_0_0REA_REDUCE(a * b),
            @"divide": ABI29_0_0REA_REDUCE(a / b),
            @"pow": ABI29_0_0REA_REDUCE(pow(a, b)),
            @"modulo": ABI29_0_0REA_REDUCE(fmodf(fmodf(a, b) + b, b)),
            @"sqrt": ABI29_0_0REA_SINGLE(sqrt(a)),
            @"sin": ABI29_0_0REA_SINGLE(sin(a)),
            @"cos": ABI29_0_0REA_SINGLE(cos(a)),
            @"exp": ABI29_0_0REA_SINGLE(exp(a)),
            @"round": ABI29_0_0REA_SINGLE(round(a)),

            // logical
            @"and": ^(NSArray<ABI29_0_0REANode *> *inputNodes) {
              BOOL res = [[inputNodes[0] value] doubleValue];
              for (NSUInteger i = 1; i < inputNodes.count && res; i++) {
                res = res && [[inputNodes[i] value] doubleValue];
              }
              return res ? @(1.) : @(0.);
            },
            @"or": ^(NSArray<ABI29_0_0REANode *> *inputNodes) {
              BOOL res = [[inputNodes[0] value] doubleValue];
              for (NSUInteger i = 1; i < inputNodes.count && !res; i++) {
                res = res || [[inputNodes[i] value] doubleValue];
              }
              return res ? @(1.) : @(0.);
            },
            @"not": ABI29_0_0REA_SINGLE(!a),
            @"defined": ^(NSArray<ABI29_0_0REANode *> *inputNodes) {
              id val = [inputNodes[0] value];
              id res = @(val != nil && !isnan([val doubleValue]));
              return res;
            },

            // comparing
            @"lessThan": ABI29_0_0REA_INFIX(a < b),
            @"eq": ABI29_0_0REA_INFIX(a == b),
            @"greaterThan": ABI29_0_0REA_INFIX(a > b),
            @"lessOrEq": ABI29_0_0REA_INFIX(a <= b),
            @"greaterOrEq": ABI29_0_0REA_INFIX(a >= b),
            @"neq": ABI29_0_0REA_INFIX(a != b),
            };
  });
  if ((self = [super initWithID:nodeID config:config])) {
    _input = config[@"input"];
    _inputNodes = [NSMutableArray arrayWithCapacity:_input.count];
    _op = OPS[config[@"op"]];
    if (!_op) {
      ABI29_0_0RCTLogError(@"Operator '%@' not found", config[@"op"]);
    }
  }
  return self;
}

- (id)evaluate
{
  for (NSUInteger i = 0; i < _input.count; i++) {
    _inputNodes[i] = [self.nodesManager findNodeByID:_input[i]];
  }
  return _op(_inputNodes);
}

@end

