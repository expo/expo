/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * based on CurvyText by iosptl: https://github.com/iosptl/ios7ptl/blob/master/ch21-Text/CurvyText/CurvyText/CurvyTextView.m
 */

#import "RNSVGBezierPath.h"
#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>

@implementation RNSVGBezierPath
{
    NSArray<NSArray *> *_bezierCurves;
    NSUInteger _bezierIndex;
    CGFloat _offset;
    CGFloat _lastX;
    CGFloat _lastDistance;
    CGPoint _lastPoint;
    CGPoint _P0;
    CGPoint _P1;
    CGPoint _P2;
    CGPoint _P3;
}

- (instancetype)initWithBezierCurves:(NSArray *)bezierCurves
{
    if (self = [super init]) {
        _bezierCurves = bezierCurves;
        _bezierIndex = 0;
        _offset = 0;
        _lastX = 0;
        _lastDistance = 0;
    }
    return self;
}

static CGFloat Bezier(CGFloat t, CGFloat P0, CGFloat P1, CGFloat P2, CGFloat P3) {
    return (1-t)*(1-t)*(1-t)*P0+3*(1-t)*(1-t)*t*P1+3*(1-t)*t*t*P2+t*t*t*P3;
}

- (CGPoint)pointForOffset:(CGFloat)t {
    CGFloat x = Bezier(t, _P0.x, _P1.x, _P2.x, _P3.x);
    CGFloat y = Bezier(t, _P0.y, _P1.y, _P2.y, _P3.y);
    return CGPointMake(x, y);
}

static CGFloat BezierPrime(CGFloat t, CGFloat P0, CGFloat P1, CGFloat P2, CGFloat P3) {
    return -3*(1-t)*(1-t)*P0+(3*(1-t)*(1-t)*P1)-(6*t*(1-t)*P1)-(3*t*t*P2)+(6*t*(1-t)*P2)+3*t*t*P3;
}

- (CGFloat)angleForOffset:(CGFloat)t {
    CGFloat dx = BezierPrime(t, _P0.x, _P1.x, _P2.x, _P3.x);
    CGFloat dy = BezierPrime(t, _P0.y, _P1.y, _P2.y, _P3.y);
    return atan2(dy, dx);
}

static CGFloat Distance(CGPoint a, CGPoint b) {
    CGFloat dx = a.x - b.x;
    CGFloat dy = a.y - b.y;
    return hypot(dx, dy);
}

// Simplistic routine to find the offset along Bezier that is
// `distance` away from `point`. `offset` is the offset used to
// generate `point`, and saves us the trouble of recalculating it
// This routine just walks forward until it finds a point at least
// `distance` away. Good optimizations here would reduce the number
// of guesses, but this is tricky since if we go too far out, the
// curve might loop back on leading to incorrect results. Tuning
// kStep is good start.
- (CGFloat)offsetAtDistance:(CGFloat)distance
                 fromPoint:(CGPoint)point
                 offset:(CGFloat)offset {
    const CGFloat kStep = 0.0005; // 0.0001 - 0.001 work well
    CGFloat newDistance = 0;
    CGFloat newOffset = offset + kStep;
    while (newDistance <= distance && newOffset < 1.0) {
        newOffset += kStep;
        newDistance = Distance(point, [self pointForOffset:newOffset]);
    }

    _lastDistance = newDistance;
    return newOffset;
}

- (void)setControlPoints
{
    NSArray *bezier = [_bezierCurves objectAtIndex:_bezierIndex];
    _bezierIndex++;
    if (bezier.count == 1) {
        _lastPoint = _P0 = [(NSValue *)[bezier objectAtIndex:0] CGPointValue];
        [self setControlPoints];
    } else if (bezier.count == 3) {
        _P1 = [(NSValue *)[bezier objectAtIndex:0] CGPointValue];
        _P2 = [(NSValue *)[bezier objectAtIndex:1] CGPointValue];
        _P3 = [(NSValue *)[bezier objectAtIndex:2] CGPointValue];
    }
}

- (CGAffineTransform)transformAtDistance:(CGFloat)distance
{
    if (_offset == 0) {
        if (_bezierCurves.count == _bezierIndex) {
            return CGAffineTransformMakeScale(0, 0);
        } else {
            [self setControlPoints];
        }
    }

    CGFloat offset = [self offsetAtDistance:distance - _lastX
                                  fromPoint:_lastPoint
                                     offset:_offset];
    CGPoint glyphPoint = [self pointForOffset:offset];
    CGFloat angle = [self angleForOffset:offset];

    if (offset < 1) {
        _offset = offset;
        _lastPoint = glyphPoint;
    } else {
        _offset = 0;
        _lastPoint = _P0 = _P3;
        _lastX += _lastDistance;
        return [self transformAtDistance:distance];
    }

    _lastX = distance;
    CGAffineTransform transform = CGAffineTransformMakeTranslation(glyphPoint.x, glyphPoint.y);
    transform = CGAffineTransformRotate(transform, angle);

    return transform;
}

@end
