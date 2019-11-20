#include <tgmath.h>

#import "ABI36_0_0REAOperatorNode.h"
#import "ABI36_0_0REANodesManager.h"

typedef id (^ABI36_0_0REAOperatorBlock)(NSArray<ABI36_0_0REANode *> *inputNodes);

#define ABI36_0_0REA_REDUCE(OP) ^(NSArray<ABI36_0_0REANode *> *inputNodes) { \
CGFloat acc = [[inputNodes[0] value] doubleValue]; \
for (NSUInteger i = 1; i < inputNodes.count; i++) { \
  CGFloat a = acc, b = [[inputNodes[i] value] doubleValue]; \
  acc = OP; \
} \
return @(acc); \
}

#define ABI36_0_0REA_SINGLE(OP) ^(NSArray<ABI36_0_0REANode *> *inputNodes) { \
CGFloat a = [[inputNodes[0] value] doubleValue]; \
return @(OP); \
}

#define ABI36_0_0REA_INFIX(OP) ^(NSArray<ABI36_0_0REANode *> *inputNodes) { \
CGFloat a = [[inputNodes[0] value] doubleValue]; \
CGFloat b = [[inputNodes[1] value] doubleValue]; \
return @(OP); \
}

@implementation ABI36_0_0REAOperatorNode {
  NSArray<NSNumber *> *_input;
  NSMutableArray<ABI36_0_0REANode *> *_inputNodes;
  ABI36_0_0REAOperatorBlock _op;
}

- (instancetype)initWithID:(ABI36_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  static NSDictionary *OPS;
  static dispatch_once_t opsToken;
  dispatch_once(&opsToken, ^{
    OPS = @{
            // arithmetic
            @"add": ABI36_0_0REA_REDUCE(a + b),
            @"sub": ABI36_0_0REA_REDUCE(a - b),
            @"multiply": ABI36_0_0REA_REDUCE(a * b),
            @"divide": ABI36_0_0REA_REDUCE(a / b),
            @"pow": ABI36_0_0REA_REDUCE(pow(a, b)),
            @"modulo": ABI36_0_0REA_REDUCE(fmodf(fmodf(a, b) + b, b)),
            @"sqrt": ABI36_0_0REA_SINGLE(sqrt(a)),
            @"log": ABI36_0_0REA_SINGLE(log(a)),
            @"sin": ABI36_0_0REA_SINGLE(sin(a)),
            @"cos": ABI36_0_0REA_SINGLE(cos(a)),
            @"tan": ABI36_0_0REA_SINGLE(tan(a)),
            @"acos": ABI36_0_0REA_SINGLE(acos(a)),
            @"asin": ABI36_0_0REA_SINGLE(asin(a)),
            @"atan": ABI36_0_0REA_SINGLE(atan(a)),
            @"exp": ABI36_0_0REA_SINGLE(exp(a)),
            @"round": ABI36_0_0REA_SINGLE(round(a)),

            // logical
            @"and": ^(NSArray<ABI36_0_0REANode *> *inputNodes) {
              BOOL res = [[inputNodes[0] value] doubleValue];
              for (NSUInteger i = 1; i < inputNodes.count && res; i++) {
                res = res && [[inputNodes[i] value] doubleValue];
              }
              return res ? @(1.) : @(0.);
            },
            @"or": ^(NSArray<ABI36_0_0REANode *> *inputNodes) {
              BOOL res = [[inputNodes[0] value] doubleValue];
              for (NSUInteger i = 1; i < inputNodes.count && !res; i++) {
                res = res || [[inputNodes[i] value] doubleValue];
              }
              return res ? @(1.) : @(0.);
            },
            @"not": ABI36_0_0REA_SINGLE(!a),
            @"defined": ^(NSArray<ABI36_0_0REANode *> *inputNodes) {
              id val = [inputNodes[0] value];
              id res = @(val != nil && !([val isKindOfClass:[NSNumber class]] && isnan([val doubleValue])));
              return res;
            },

            // comparing
            @"lessThan": ABI36_0_0REA_INFIX(a < b),
            @"eq": ABI36_0_0REA_INFIX(a == b),
            @"greaterThan": ABI36_0_0REA_INFIX(a > b),
            @"lessOrEq": ABI36_0_0REA_INFIX(a <= b),
            @"greaterOrEq": ABI36_0_0REA_INFIX(a >= b),
            @"neq": ABI36_0_0REA_INFIX(a != b),
            };
  });
  if ((self = [super initWithID:nodeID config:config])) {
    _input = config[@"input"];
    _inputNodes = [NSMutableArray arrayWithCapacity:_input.count];
    _op = OPS[config[@"op"]];
    if (!_op) {
      ABI36_0_0RCTLogError(@"Operator '%@' not found", config[@"op"]);
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

