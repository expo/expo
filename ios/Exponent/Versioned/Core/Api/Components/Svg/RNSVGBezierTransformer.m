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

#import "RNSVGBezierTransformer.h"

@implementation RNSVGBezierTransformer
{
    NSArray<NSArray *> *_bezierCurves;
    int _currentBezierIndex;
    CGFloat _startOffset;
    CGFloat _lastOffset;
    CGFloat _lastRecord;
    CGFloat _lastDistance;
    CGPoint _lastPoint;
    CGPoint _P0;
    CGPoint _P1;
    CGPoint _P2;
    CGPoint _P3;
    BOOL _reachedEnd;
    BOOL _reachedStart;
}

- (instancetype)initWithBezierCurvesAndStartOffset:(NSArray<NSArray *> *)bezierCurves startOffset:(CGFloat)startOffset
{
    if (self = [super init]) {
        _bezierCurves = bezierCurves;
        _currentBezierIndex = _lastOffset = _lastRecord = _lastDistance = 0;
        _startOffset = startOffset;
        [self setControlPoints];
    }
    return self;
}

static CGFloat calculateBezier(CGFloat t, CGFloat P0, CGFloat P1, CGFloat P2, CGFloat P3) {
    return (1-t)*(1-t)*(1-t)*P0+3*(1-t)*(1-t)*t*P1+3*(1-t)*t*t*P2+t*t*t*P3;
}

- (CGPoint)pointAtOffset:(CGFloat)t {
    CGFloat x = calculateBezier(t, _P0.x, _P1.x, _P2.x, _P3.x);
    CGFloat y = calculateBezier(t, _P0.y, _P1.y, _P2.y, _P3.y);
    return CGPointMake(x, y);
}

static CGFloat calculateBezierPrime(CGFloat t, CGFloat P0, CGFloat P1, CGFloat P2, CGFloat P3) {
    return -3*(1-t)*(1-t)*P0+(3*(1-t)*(1-t)*P1)-(6*t*(1-t)*P1)-(3*t*t*P2)+(6*t*(1-t)*P2)+3*t*t*P3;
}

- (CGFloat)angleAtOffset:(CGFloat)t {
    CGFloat dx = calculateBezierPrime(t, _P0.x, _P1.x, _P2.x, _P3.x);
    CGFloat dy = calculateBezierPrime(t, _P0.y, _P1.y, _P2.y, _P3.y);
    return atan2(dy, dx);
}

static CGFloat calculateDistance(CGPoint a, CGPoint b) {
    return hypot(a.x - b.x, a.y - b.y);
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
    
    const CGFloat kStep = 0.001; // 0.0001 - 0.001 work well
    CGFloat newDistance = 0;
    CGFloat newOffset = offset + kStep;
    while (newDistance <= distance && newOffset < 1.0) {
        newOffset += kStep;
        newDistance = calculateDistance(point, [self pointAtOffset:newOffset]);
    }
    
    _lastDistance = newDistance;
    return newOffset;
}

- (void)setControlPoints
{
    NSArray *bezier = [_bezierCurves objectAtIndex:_currentBezierIndex++];
    
    // set start point
    if (bezier.count == 1) {
        _lastPoint = _P0 = [[bezier objectAtIndex:0] CGPointValue];
        [self setControlPoints];
    } else if (bezier.count == 3) {
        _P1 = [[bezier objectAtIndex:0] CGPointValue];
        _P2 = [[bezier objectAtIndex:1] CGPointValue];
        _P3 = [[bezier objectAtIndex:2] CGPointValue];
    }
}


- (CGAffineTransform)getTransformAtDistance:(CGFloat)distance
{
    distance += _startOffset;
    _reachedStart = distance >= 0;
    if (_reachedEnd || !_reachedStart) {
        return CGAffineTransformIdentity;
    }
    
    CGFloat offset = [self offsetAtDistance:distance - _lastRecord
                                  fromPoint:_lastPoint
                                     offset:_lastOffset];
    
    if (offset < 1) {
        CGPoint glyphPoint = [self pointAtOffset:offset];
        _lastOffset = offset;
        _lastPoint = glyphPoint;
        _lastRecord = distance;
        return CGAffineTransformRotate(CGAffineTransformMakeTranslation(glyphPoint.x, glyphPoint.y), [self angleAtOffset:offset]);
    } else if (_bezierCurves.count == _currentBezierIndex) {
        _reachedEnd = YES;
        return CGAffineTransformIdentity;
    } else {
        _lastOffset = 0;
        _lastPoint = _P0 = _P3;
        _lastRecord += _lastDistance;
        [self setControlPoints];
        return [self getTransformAtDistance:distance - _startOffset];
    }
}

- (BOOL)hasReachedEnd
{
    return _reachedEnd;
}

- (BOOL)hasReachedStart
{
    return _reachedStart;
}

@end
