#import "DevMenuREABezierNode.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREAUtils.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#include <tgmath.h>

#define EPS 1e-5

@implementation DevMenuREABezierNode {
  CGFloat ax, bx, cx, ay, by, cy;
  NSNumber *_inputNodeID;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _inputNodeID = [RCTConvert NSNumber:config[@"input"]];
    DevMenuREA_LOG_ERROR_IF_NIL(
        _inputNodeID, @"DevMenuReanimated: First argument passed to bezier node is either of wrong type or is missing.");

    CGFloat mX1 = [config[@"mX1"] doubleValue];
    CGFloat mY1 = [config[@"mY1"] doubleValue];
    CGFloat mX2 = [config[@"mX2"] doubleValue];
    CGFloat mY2 = [config[@"mY2"] doubleValue];

    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    cx = 3.0 * mX1;
    bx = 3.0 * (mX2 - mX1) - cx;
    ax = 1.0 - cx - bx;

    cy = 3.0 * mY1;
    by = 3.0 * (mY2 - mY1) - cy;
    ay = 1.0 - cy - by;
  }
  return self;
}

- (CGFloat)sampleCurveX:(CGFloat)t
{
  // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
  return ((ax * t + bx) * t + cx) * t;
}

- (CGFloat)sampleCurveY:(CGFloat)t
{
  return ((ay * t + by) * t + cy) * t;
}

- (CGFloat)sampleCurveDerivativeX:(CGFloat)t
{
  return (3.0 * ax * t + 2.0 * bx) * t + cx;
}

- (CGFloat)solveCurveX:(CGFloat)x withEpsilon:(CGFloat)epsilon
{
  CGFloat t0, t1, t2, x2, d2;
  NSUInteger i;

  // First try a few iterations of Newton's method -- normally very fast.
  for (t2 = x, i = 0; i < 8; i++) {
    x2 = [self sampleCurveX:t2] - x;
    if (fabs(x2) < epsilon)
      return t2;
    d2 = [self sampleCurveDerivativeX:t2];
    if (fabs(d2) < 1e-6)
      break;
    t2 = t2 - x2 / d2;
  }

  // Fall back to the bisection method for reliability.
  t0 = 0.0;
  t1 = 1.0;
  t2 = x;

  if (t2 < t0)
    return t0;
  if (t2 > t1)
    return t1;

  while (t0 < t1) {
    x2 = [self sampleCurveX:t2];
    if (fabs(x2 - x) < epsilon)
      return t2;
    if (x > x2)
      t0 = t2;
    else
      t1 = t2;
    t2 = (t1 - t0) * .5 + t0;
  }

  // Failure.
  return t2;
}

- (id)evaluate
{
  CGFloat x = [[[self.nodesManager findNodeByID:_inputNodeID] value] doubleValue];
  CGFloat y = [self sampleCurveY:[self solveCurveX:x withEpsilon:EPS]];
  return @(y);
}

@end
