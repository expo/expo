#include <tgmath.h>

#import "ABI43_0_0REAOperatorNode.h"
#import "ABI43_0_0REANodesManager.h"

typedef id (^ABI43_0_0REAOperatorBlock)(NSArray<ABI43_0_0REANode *> *inputNodes);

#define ABI43_0_0REA_REDUCE(OP) ^(NSArray<ABI43_0_0REANode *> *inputNodes) { \
double acc = [[inputNodes[0] value] doubleValue]; \
for (NSUInteger i = 1; i < inputNodes.count; i++) { \
  double a = acc, b = [[inputNodes[i] value] doubleValue]; \
  acc = OP; \
} \
return @(acc); \
}

#define ABI43_0_0REA_SINGLE(OP) ^(NSArray<ABI43_0_0REANode *> *inputNodes) { \
double a = [[inputNodes[0] value] doubleValue]; \
return @(OP); \
}

#define ABI43_0_0REA_INFIX(OP) ^(NSArray<ABI43_0_0REANode *> *inputNodes) { \
double a = [[inputNodes[0] value] doubleValue]; \
double b = [[inputNodes[1] value] doubleValue]; \
return @(OP); \
}

@implementation ABI43_0_0REAOperatorNode {
  NSArray<NSNumber *> *_input;
  NSMutableArray<ABI43_0_0REANode *> *_inputNodes;
  ABI43_0_0REAOperatorBlock _op;
}

- (instancetype)initWithID:(ABI43_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  static NSDictionary *OPS;
  static dispatch_once_t opsToken;
  dispatch_once(&opsToken, ^{
    OPS = @{
            // arithmetic
            @"add": ABI43_0_0REA_REDUCE(a + b),
            @"sub": ABI43_0_0REA_REDUCE(a - b),
            @"multiply": ABI43_0_0REA_REDUCE(a * b),
            @"divide": ABI43_0_0REA_REDUCE(a / b),
            @"pow": ABI43_0_0REA_REDUCE(pow(a, b)),
            @"modulo": ABI43_0_0REA_REDUCE(fmod(fmod(a, b) + b, b)),
            @"sqrt": ABI43_0_0REA_SINGLE(sqrt(a)),
            @"log": ABI43_0_0REA_SINGLE(log(a)),
            @"sin": ABI43_0_0REA_SINGLE(sin(a)),
            @"cos": ABI43_0_0REA_SINGLE(cos(a)),
            @"tan": ABI43_0_0REA_SINGLE(tan(a)),
            @"acos": ABI43_0_0REA_SINGLE(acos(a)),
            @"asin": ABI43_0_0REA_SINGLE(asin(a)),
            @"atan": ABI43_0_0REA_SINGLE(atan(a)),
            @"exp": ABI43_0_0REA_SINGLE(exp(a)),
            @"round": ABI43_0_0REA_SINGLE(round(a)),
            @"abs": ABI43_0_0REA_SINGLE(fabs(a)),
            @"ceil": ABI43_0_0REA_SINGLE(ceil(a)),
            @"floor": ABI43_0_0REA_SINGLE(floor(a)),
            @"max": ABI43_0_0REA_REDUCE(MAX(a, b)),
            @"min": ABI43_0_0REA_REDUCE(MIN(a, b)),

            // logical
            @"and": ^(NSArray<ABI43_0_0REANode *> *inputNodes) {
              BOOL res = [[inputNodes[0] value] doubleValue];
              for (NSUInteger i = 1; i < inputNodes.count && res; i++) {
                res = res && [[inputNodes[i] value] doubleValue];
              }
              return res ? @(1.) : @(0.);
            },
            @"or": ^(NSArray<ABI43_0_0REANode *> *inputNodes) {
              BOOL res = [[inputNodes[0] value] doubleValue];
              for (NSUInteger i = 1; i < inputNodes.count && !res; i++) {
                res = res || [[inputNodes[i] value] doubleValue];
              }
              return res ? @(1.) : @(0.);
            },
            @"not": ABI43_0_0REA_SINGLE(!a),
            @"defined": ^(NSArray<ABI43_0_0REANode *> *inputNodes) {
              id val = [inputNodes[0] value];
              id res = @(val != nil && !([val isKindOfClass:[NSNumber class]] && isnan([val doubleValue])));
              return res;
            },

            // comparing
            @"lessThan": ABI43_0_0REA_INFIX(a < b),
            @"eq": ABI43_0_0REA_INFIX(a == b),
            @"greaterThan": ABI43_0_0REA_INFIX(a > b),
            @"lessOrEq": ABI43_0_0REA_INFIX(a <= b),
            @"greaterOrEq": ABI43_0_0REA_INFIX(a >= b),
             @"neq": ABI43_0_0REA_INFIX(a != b),
            };
  });
  if ((self = [super initWithID:nodeID config:config])) {
    _input = config[@"input"];
    _inputNodes = [NSMutableArray arrayWithCapacity:_input.count];
    _op = OPS[config[@"op"]];
    if (!_op) {
      ABI43_0_0RCTLogError(@"Operator '%@' not found", config[@"op"]);
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

