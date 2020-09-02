#include <tgmath.h>

#import "REAOperatorNode.h"
#import "REANodesManager.h"

typedef id (^REAOperatorBlock)(NSArray<REANode *> *inputNodes);

#define REA_REDUCE(OP) ^(NSArray<REANode *> *inputNodes) { \
double acc = [[inputNodes[0] value] doubleValue]; \
for (NSUInteger i = 1; i < inputNodes.count; i++) { \
  double a = acc, b = [[inputNodes[i] value] doubleValue]; \
  acc = OP; \
} \
return @(acc); \
}

#define REA_SINGLE(OP) ^(NSArray<REANode *> *inputNodes) { \
double a = [[inputNodes[0] value] doubleValue]; \
return @(OP); \
}

#define REA_INFIX(OP) ^(NSArray<REANode *> *inputNodes) { \
double a = [[inputNodes[0] value] doubleValue]; \
double b = [[inputNodes[1] value] doubleValue]; \
return @(OP); \
}

@implementation REAOperatorNode {
  NSArray<NSNumber *> *_input;
  NSMutableArray<REANode *> *_inputNodes;
  REAOperatorBlock _op;
}

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
  static NSDictionary *OPS;
  static dispatch_once_t opsToken;
  dispatch_once(&opsToken, ^{
    OPS = @{
            // arithmetic
            @"add": REA_REDUCE(a + b),
            @"sub": REA_REDUCE(a - b),
            @"multiply": REA_REDUCE(a * b),
            @"divide": REA_REDUCE(a / b),
            @"pow": REA_REDUCE(pow(a, b)),
            @"modulo": REA_REDUCE(fmod(fmod(a, b) + b, b)),
            @"sqrt": REA_SINGLE(sqrt(a)),
            @"log": REA_SINGLE(log(a)),
            @"sin": REA_SINGLE(sin(a)),
            @"cos": REA_SINGLE(cos(a)),
            @"tan": REA_SINGLE(tan(a)),
            @"acos": REA_SINGLE(acos(a)),
            @"asin": REA_SINGLE(asin(a)),
            @"atan": REA_SINGLE(atan(a)),
            @"exp": REA_SINGLE(exp(a)),
            @"round": REA_SINGLE(round(a)),
            @"abs": REA_SINGLE(fabs(a)),
            @"ceil": REA_SINGLE(ceil(a)),
            @"floor": REA_SINGLE(floor(a)),
            @"max": REA_REDUCE(MAX(a, b)),
            @"min": REA_REDUCE(MIN(a, b)),

            // logical
            @"and": ^(NSArray<REANode *> *inputNodes) {
              BOOL res = [[inputNodes[0] value] doubleValue];
              for (NSUInteger i = 1; i < inputNodes.count && res; i++) {
                res = res && [[inputNodes[i] value] doubleValue];
              }
              return res ? @(1.) : @(0.);
            },
            @"or": ^(NSArray<REANode *> *inputNodes) {
              BOOL res = [[inputNodes[0] value] doubleValue];
              for (NSUInteger i = 1; i < inputNodes.count && !res; i++) {
                res = res || [[inputNodes[i] value] doubleValue];
              }
              return res ? @(1.) : @(0.);
            },
            @"not": REA_SINGLE(!a),
            @"defined": ^(NSArray<REANode *> *inputNodes) {
              id val = [inputNodes[0] value];
              id res = @(val != nil && !([val isKindOfClass:[NSNumber class]] && isnan([val doubleValue])));
              return res;
            },

            // comparing
            @"lessThan": REA_INFIX(a < b),
            @"eq": REA_INFIX(a == b),
            @"greaterThan": REA_INFIX(a > b),
            @"lessOrEq": REA_INFIX(a <= b),
            @"greaterOrEq": REA_INFIX(a >= b),
             @"neq": REA_INFIX(a != b),
            };
  });
  if ((self = [super initWithID:nodeID config:config])) {
    _input = config[@"input"];
    _inputNodes = [NSMutableArray arrayWithCapacity:_input.count];
    _op = OPS[config[@"op"]];
    if (!_op) {
      RCTLogError(@"Operator '%@' not found", config[@"op"]);
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

