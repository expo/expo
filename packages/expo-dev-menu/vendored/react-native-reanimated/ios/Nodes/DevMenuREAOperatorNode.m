#import "DevMenuREANodesManager.h"
#import "DevMenuREAOperatorNode.h"
#include <tgmath.h>

typedef id (^DevMenuREAOperatorBlock)(NSArray<DevMenuREANode *> *inputNodes);

#define DevMenuREA_REDUCE(OP)                                         \
  ^(NSArray<DevMenuREANode *> * inputNodes) {                         \
    double acc = [[inputNodes[0] value] doubleValue];          \
    for (NSUInteger i = 1; i < inputNodes.count; i++) {        \
      double a = acc, b = [[inputNodes[i] value] doubleValue]; \
      acc = OP;                                                \
    }                                                          \
    return @(acc);                                             \
  }

#define DevMenuREA_SINGLE(OP)                              \
  ^(NSArray<DevMenuREANode *> * inputNodes) {              \
    double a = [[inputNodes[0] value] doubleValue]; \
    return @(OP);                                   \
  }

#define DevMenuREA_INFIX(OP)                               \
  ^(NSArray<DevMenuREANode *> * inputNodes) {              \
    double a = [[inputNodes[0] value] doubleValue]; \
    double b = [[inputNodes[1] value] doubleValue]; \
    return @(OP);                                   \
  }

@implementation DevMenuREAOperatorNode {
  NSArray<NSNumber *> *_input;
  NSMutableArray<DevMenuREANode *> *_inputNodes;
  DevMenuREAOperatorBlock _op;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *OPS;
  static dispatch_once_t opsToken;
  dispatch_once(&opsToken, ^{
    OPS = @{// arithmetic
            @"add" : DevMenuREA_REDUCE(a + b),
            @"sub" : DevMenuREA_REDUCE(a - b),
            @"multiply" : DevMenuREA_REDUCE(a * b),
            @"divide" : DevMenuREA_REDUCE(a / b),
            @"pow" : DevMenuREA_REDUCE(pow(a, b)),
            @"modulo" : DevMenuREA_REDUCE(fmod(fmod(a, b) + b, b)),
            @"sqrt" : DevMenuREA_SINGLE(sqrt(a)),
            @"log" : DevMenuREA_SINGLE(log(a)),
            @"sin" : DevMenuREA_SINGLE(sin(a)),
            @"cos" : DevMenuREA_SINGLE(cos(a)),
            @"tan" : DevMenuREA_SINGLE(tan(a)),
            @"acos" : DevMenuREA_SINGLE(acos(a)),
            @"asin" : DevMenuREA_SINGLE(asin(a)),
            @"atan" : DevMenuREA_SINGLE(atan(a)),
            @"exp" : DevMenuREA_SINGLE(exp(a)),
            @"round" : DevMenuREA_SINGLE(round(a)),
            @"abs" : DevMenuREA_SINGLE(fabs(a)),
            @"ceil" : DevMenuREA_SINGLE(ceil(a)),
            @"floor" : DevMenuREA_SINGLE(floor(a)),
            @"max" : DevMenuREA_REDUCE(MAX(a, b)),
            @"min" : DevMenuREA_REDUCE(MIN(a, b)),

            // logical
            @"and" : ^(NSArray<DevMenuREANode *> *inputNodes){
                BOOL res = [[inputNodes[0] value] doubleValue];
    for (NSUInteger i = 1; i < inputNodes.count && res; i++) {
      res = res && [[inputNodes[i] value] doubleValue];
    }
    return res ? @(1.) : @(0.);
            },
            @"or": ^(NSArray<DevMenuREANode *> *inputNodes) {
    BOOL res = [[inputNodes[0] value] doubleValue];
    for (NSUInteger i = 1; i < inputNodes.count && !res; i++) {
      res = res || [[inputNodes[i] value] doubleValue];
    }
    return res ? @(1.) : @(0.);
            },
            @"not": DevMenuREA_SINGLE(!a),
            @"defined": ^(NSArray<DevMenuREANode *> *inputNodes) {
    id val = [inputNodes[0] value];
    id res = @(val != nil && !([val isKindOfClass:[NSNumber class]] && isnan([val doubleValue])));
    return res;
            },

            // comparing
            @"lessThan": DevMenuREA_INFIX(a < b),
            @"eq": DevMenuREA_INFIX(a == b),
            @"greaterThan": DevMenuREA_INFIX(a > b),
            @"lessOrEq": DevMenuREA_INFIX(a <= b),
            @"greaterOrEq": DevMenuREA_INFIX(a >= b),
             @"neq": DevMenuREA_INFIX(a != b),
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
