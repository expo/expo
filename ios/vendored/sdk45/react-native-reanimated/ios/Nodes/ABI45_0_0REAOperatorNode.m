#import <ABI45_0_0RNReanimated/ABI45_0_0REANodesManager.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAOperatorNode.h>
#include <tgmath.h>

typedef id (^ABI45_0_0REAOperatorBlock)(NSArray<ABI45_0_0REANode *> *inputNodes);

#define ABI45_0_0REA_REDUCE(OP)                                         \
  ^(NSArray<ABI45_0_0REANode *> * inputNodes) {                         \
    double acc = [[inputNodes[0] value] doubleValue];          \
    for (NSUInteger i = 1; i < inputNodes.count; i++) {        \
      double a = acc, b = [[inputNodes[i] value] doubleValue]; \
      acc = OP;                                                \
    }                                                          \
    return @(acc);                                             \
  }

#define ABI45_0_0REA_SINGLE(OP)                              \
  ^(NSArray<ABI45_0_0REANode *> * inputNodes) {              \
    double a = [[inputNodes[0] value] doubleValue]; \
    return @(OP);                                   \
  }

#define ABI45_0_0REA_INFIX(OP)                               \
  ^(NSArray<ABI45_0_0REANode *> * inputNodes) {              \
    double a = [[inputNodes[0] value] doubleValue]; \
    double b = [[inputNodes[1] value] doubleValue]; \
    return @(OP);                                   \
  }

@implementation ABI45_0_0REAOperatorNode {
  NSArray<NSNumber *> *_input;
  NSMutableArray<ABI45_0_0REANode *> *_inputNodes;
  ABI45_0_0REAOperatorBlock _op;
}

- (instancetype)initWithID:(ABI45_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *OPS;
  static dispatch_once_t opsToken;
  dispatch_once(&opsToken, ^{
    OPS = @{// arithmetic
            @"add" : ABI45_0_0REA_REDUCE(a + b),
            @"sub" : ABI45_0_0REA_REDUCE(a - b),
            @"multiply" : ABI45_0_0REA_REDUCE(a * b),
            @"divide" : ABI45_0_0REA_REDUCE(a / b),
            @"pow" : ABI45_0_0REA_REDUCE(pow(a, b)),
            @"modulo" : ABI45_0_0REA_REDUCE(fmod(fmod(a, b) + b, b)),
            @"sqrt" : ABI45_0_0REA_SINGLE(sqrt(a)),
            @"log" : ABI45_0_0REA_SINGLE(log(a)),
            @"sin" : ABI45_0_0REA_SINGLE(sin(a)),
            @"cos" : ABI45_0_0REA_SINGLE(cos(a)),
            @"tan" : ABI45_0_0REA_SINGLE(tan(a)),
            @"acos" : ABI45_0_0REA_SINGLE(acos(a)),
            @"asin" : ABI45_0_0REA_SINGLE(asin(a)),
            @"atan" : ABI45_0_0REA_SINGLE(atan(a)),
            @"exp" : ABI45_0_0REA_SINGLE(exp(a)),
            @"round" : ABI45_0_0REA_SINGLE(round(a)),
            @"abs" : ABI45_0_0REA_SINGLE(fabs(a)),
            @"ceil" : ABI45_0_0REA_SINGLE(ceil(a)),
            @"floor" : ABI45_0_0REA_SINGLE(floor(a)),
            @"max" : ABI45_0_0REA_REDUCE(MAX(a, b)),
            @"min" : ABI45_0_0REA_REDUCE(MIN(a, b)),

            // logical
            @"and" : ^(NSArray<ABI45_0_0REANode *> *inputNodes){
                BOOL res = [[inputNodes[0] value] doubleValue];
    for (NSUInteger i = 1; i < inputNodes.count && res; i++) {
      res = res && [[inputNodes[i] value] doubleValue];
    }
    return res ? @(1.) : @(0.);
            },
            @"or": ^(NSArray<ABI45_0_0REANode *> *inputNodes) {
    BOOL res = [[inputNodes[0] value] doubleValue];
    for (NSUInteger i = 1; i < inputNodes.count && !res; i++) {
      res = res || [[inputNodes[i] value] doubleValue];
    }
    return res ? @(1.) : @(0.);
            },
            @"not": ABI45_0_0REA_SINGLE(!a),
            @"defined": ^(NSArray<ABI45_0_0REANode *> *inputNodes) {
    id val = [inputNodes[0] value];
    id res = @(val != nil && !([val isKindOfClass:[NSNumber class]] && isnan([val doubleValue])));
    return res;
            },

            // comparing
            @"lessThan": ABI45_0_0REA_INFIX(a < b),
            @"eq": ABI45_0_0REA_INFIX(a == b),
            @"greaterThan": ABI45_0_0REA_INFIX(a > b),
            @"lessOrEq": ABI45_0_0REA_INFIX(a <= b),
            @"greaterOrEq": ABI45_0_0REA_INFIX(a >= b),
             @"neq": ABI45_0_0REA_INFIX(a != b),
};
});
if ((self = [super initWithID:nodeID config:config])) {
  _input = config[@"input"];
  _inputNodes = [NSMutableArray arrayWithCapacity:_input.count];
  _op = OPS[config[@"op"]];
  if (!_op) {
    ABI45_0_0RCTLogError(@"Operator '%@' not found", config[@"op"]);
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
