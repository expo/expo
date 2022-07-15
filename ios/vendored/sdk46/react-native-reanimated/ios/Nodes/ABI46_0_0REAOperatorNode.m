#import <ABI46_0_0RNReanimated/ABI46_0_0REANodesManager.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REAOperatorNode.h>
#include <tgmath.h>

typedef id (^ABI46_0_0REAOperatorBlock)(NSArray<ABI46_0_0REANode *> *inputNodes);

#define ABI46_0_0REA_REDUCE(OP)                                         \
  ^(NSArray<ABI46_0_0REANode *> * inputNodes) {                         \
    double acc = [[inputNodes[0] value] doubleValue];          \
    for (NSUInteger i = 1; i < inputNodes.count; i++) {        \
      double a = acc, b = [[inputNodes[i] value] doubleValue]; \
      acc = OP;                                                \
    }                                                          \
    return @(acc);                                             \
  }

#define ABI46_0_0REA_SINGLE(OP)                              \
  ^(NSArray<ABI46_0_0REANode *> * inputNodes) {              \
    double a = [[inputNodes[0] value] doubleValue]; \
    return @(OP);                                   \
  }

#define ABI46_0_0REA_INFIX(OP)                               \
  ^(NSArray<ABI46_0_0REANode *> * inputNodes) {              \
    double a = [[inputNodes[0] value] doubleValue]; \
    double b = [[inputNodes[1] value] doubleValue]; \
    return @(OP);                                   \
  }

@implementation ABI46_0_0REAOperatorNode {
  NSArray<NSNumber *> *_input;
  NSMutableArray<ABI46_0_0REANode *> *_inputNodes;
  ABI46_0_0REAOperatorBlock _op;
}

- (instancetype)initWithID:(ABI46_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *OPS;
  static dispatch_once_t opsToken;
  dispatch_once(&opsToken, ^{
    OPS = @{// arithmetic
            @"add" : ABI46_0_0REA_REDUCE(a + b),
            @"sub" : ABI46_0_0REA_REDUCE(a - b),
            @"multiply" : ABI46_0_0REA_REDUCE(a * b),
            @"divide" : ABI46_0_0REA_REDUCE(a / b),
            @"pow" : ABI46_0_0REA_REDUCE(pow(a, b)),
            @"modulo" : ABI46_0_0REA_REDUCE(fmod(fmod(a, b) + b, b)),
            @"sqrt" : ABI46_0_0REA_SINGLE(sqrt(a)),
            @"log" : ABI46_0_0REA_SINGLE(log(a)),
            @"sin" : ABI46_0_0REA_SINGLE(sin(a)),
            @"cos" : ABI46_0_0REA_SINGLE(cos(a)),
            @"tan" : ABI46_0_0REA_SINGLE(tan(a)),
            @"acos" : ABI46_0_0REA_SINGLE(acos(a)),
            @"asin" : ABI46_0_0REA_SINGLE(asin(a)),
            @"atan" : ABI46_0_0REA_SINGLE(atan(a)),
            @"exp" : ABI46_0_0REA_SINGLE(exp(a)),
            @"round" : ABI46_0_0REA_SINGLE(round(a)),
            @"abs" : ABI46_0_0REA_SINGLE(fabs(a)),
            @"ceil" : ABI46_0_0REA_SINGLE(ceil(a)),
            @"floor" : ABI46_0_0REA_SINGLE(floor(a)),
            @"max" : ABI46_0_0REA_REDUCE(MAX(a, b)),
            @"min" : ABI46_0_0REA_REDUCE(MIN(a, b)),

            // logical
            @"and" : ^(NSArray<ABI46_0_0REANode *> *inputNodes){
                BOOL res = [[inputNodes[0] value] doubleValue];
    for (NSUInteger i = 1; i < inputNodes.count && res; i++) {
      res = res && [[inputNodes[i] value] doubleValue];
    }
    return res ? @(1.) : @(0.);
            },
            @"or": ^(NSArray<ABI46_0_0REANode *> *inputNodes) {
    BOOL res = [[inputNodes[0] value] doubleValue];
    for (NSUInteger i = 1; i < inputNodes.count && !res; i++) {
      res = res || [[inputNodes[i] value] doubleValue];
    }
    return res ? @(1.) : @(0.);
            },
            @"not": ABI46_0_0REA_SINGLE(!a),
            @"defined": ^(NSArray<ABI46_0_0REANode *> *inputNodes) {
    id val = [inputNodes[0] value];
    id res = @(val != nil && !([val isKindOfClass:[NSNumber class]] && isnan([val doubleValue])));
    return res;
            },

            // comparing
            @"lessThan": ABI46_0_0REA_INFIX(a < b),
            @"eq": ABI46_0_0REA_INFIX(a == b),
            @"greaterThan": ABI46_0_0REA_INFIX(a > b),
            @"lessOrEq": ABI46_0_0REA_INFIX(a <= b),
            @"greaterOrEq": ABI46_0_0REA_INFIX(a >= b),
             @"neq": ABI46_0_0REA_INFIX(a != b),
};
});
if ((self = [super initWithID:nodeID config:config])) {
  _input = config[@"input"];
  _inputNodes = [NSMutableArray arrayWithCapacity:_input.count];
  _op = OPS[config[@"op"]];
  if (!_op) {
    ABI46_0_0RCTLogError(@"Operator '%@' not found", config[@"op"]);
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
