/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGPathParser.h"
#import <React/RCTLog.h>
#import <math.h>

@implementation RNSVGPathParser
{
    NSString* _d;
    NSString* _originD;
    NSRegularExpression* _pathRegularExpression;
    NSMutableArray<NSArray *>* _bezierCurves;
    NSValue *_lastStartPoint;
    float _penX;
    float _penY;
    float _penDownX;
    float _penDownY;
    float _pivotX;
    float _pivotY;
    BOOL _valid;
    BOOL _penDownSet;
}

- (instancetype) initWithPathString:(NSString *)d
{
    if (self = [super init]) {
        NSRegularExpression* decimalRegularExpression = [[NSRegularExpression alloc] initWithPattern:@"(\\.\\d+)(?=\\-?\\.)" options:0 error:nil];
        _originD = d;
        _d = [decimalRegularExpression stringByReplacingMatchesInString:d options:0 range:NSMakeRange(0, [d length]) withTemplate:@"$1,"];
        _pathRegularExpression = [[NSRegularExpression alloc] initWithPattern:@"[a-df-z]|[\\-+]?(?:[\\d.]e[\\-+]?|[^\\s\\-+,a-z])+" options:NSRegularExpressionCaseInsensitive error:nil];
    }
    return self;
}

- (CGPathRef)getPath
{
    CGMutablePathRef path = CGPathCreateMutable();
    NSArray<NSTextCheckingResult *>* results = [_pathRegularExpression matchesInString:_d options:0 range:NSMakeRange(0, [_d length])];
    _bezierCurves = [[NSMutableArray alloc] init];
    int count = [results count];

    if (count) {
        NSUInteger i = 0;
        #define NEXT_VALUE [self getNextValue:results[i++]]
        #define NEXT_FLOAT [self float:NEXT_VALUE]
        #define NEXT_BOOL [self bool:NEXT_VALUE]
        NSString* lastCommand;
        NSString* command = NEXT_VALUE;

        @try {
            while (command) {
                if ([command isEqualToString:@"m"]) { // moveTo command
                    [self move:path x:NEXT_FLOAT y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"M"]) {
                    [self moveTo:path x:NEXT_FLOAT y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"l"]) { // lineTo command
                    [self line:path x:NEXT_FLOAT y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"L"]) {
                    [self lineTo:path x:NEXT_FLOAT y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"h"]) { // horizontalTo command
                    [self line:path x:NEXT_FLOAT y:0];
                } else if ([command isEqualToString:@"H"]) {
                    [self lineTo:path x:NEXT_FLOAT y:_penY];
                } else if ([command isEqualToString:@"v"]) { // verticalTo command
                    [self line:path x:0 y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"V"]) {
                    [self lineTo:path x:_penX y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"c"]) { // curveTo command
                    [self curve:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT c2x:NEXT_FLOAT c2y:NEXT_FLOAT ex:NEXT_FLOAT ey:NEXT_FLOAT];
                } else if ([command isEqualToString:@"C"]) {
                    [self curveTo:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT c2x:NEXT_FLOAT c2y:NEXT_FLOAT ex:NEXT_FLOAT ey:NEXT_FLOAT];
                } else if ([command isEqualToString:@"s"]) { // smoothCurveTo command
                    [self smoothCurve:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT ex:NEXT_FLOAT ey:NEXT_FLOAT];
                } else if ([command isEqualToString:@"S"]) {
                    [self smoothCurveTo:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT ex:NEXT_FLOAT ey:NEXT_FLOAT];
                } else if ([command isEqualToString:@"q"]) { // quadraticBezierCurveTo command
                    [self quadraticBezierCurve:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT c2x:NEXT_FLOAT c2y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"Q"]) {
                    [self quadraticBezierCurveTo:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT c2x:NEXT_FLOAT c2y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"t"]) {// smoothQuadraticBezierCurveTo command
                    [self smoothQuadraticBezierCurve:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"T"]) {
                    [self smoothQuadraticBezierCurveTo:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"a"]) { // arcTo command
                    [self arc:path rx:NEXT_FLOAT ry:NEXT_FLOAT rotation:NEXT_FLOAT outer:NEXT_BOOL clockwise:NEXT_BOOL x:NEXT_FLOAT y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"A"]) {
                    [self arcTo:path rx:NEXT_FLOAT ry:NEXT_FLOAT rotation:NEXT_FLOAT outer:NEXT_BOOL clockwise:NEXT_BOOL x:NEXT_FLOAT y:NEXT_FLOAT];
                } else if ([command isEqualToString:@"z"]) { // close command
                    [self close:path];
                } else if ([command isEqualToString:@"Z"]) {
                    [self close:path];
                } else {
                    command = lastCommand;
                    i--;
                    continue;
                }

                lastCommand = command;
                if ([lastCommand isEqualToString:@"m"]) {
                    lastCommand = @"l";
                } else if ([lastCommand isEqualToString:@"M"]) {
                    lastCommand = @"L";
                }

                command = i < count ? NEXT_VALUE : nil;
            }
        } @catch (NSException *exception) {
            RCTLogWarn(@"Invalid CGPath format: %@", _originD);
            CGPathRelease(path);
            return nil;
        }

    }

    return (CGPathRef)CFAutorelease(path);
}

- (NSArray *)getBezierCurves
{
    if (!_bezierCurves) {
        CGPathRelease([self getPath]);
    }

    return [_bezierCurves copy];
}

- (NSString *)getNextValue:(NSTextCheckingResult *)result
{
    if (!result) {
        return nil;
    }
    return [_d substringWithRange:NSMakeRange(result.range.location, result.range.length)];
}

- (float)float:(NSString *)value
{
    return [value floatValue];
}

- (BOOL)bool:(NSString *)value
{
    return ![value isEqualToString:@"0"];
}

- (void)move:(CGMutablePathRef)path x:(float)x y:(float)y
{
    [self moveTo:path x:x + _penX y:y + _penY];
}

- (void)moveTo:(CGMutablePathRef)path x:(float)x y:(float)y
{
    _pivotX = _penX = x;
    _pivotY = _penY = y;
    CGPathMoveToPoint(path, nil, x, y);

    _lastStartPoint = [NSValue valueWithCGPoint: CGPointMake(x, y)];
    [_bezierCurves addObject: @[_lastStartPoint]];
}

- (void)line:(CGMutablePathRef)path x:(float)x y:(float)y
{
    [self lineTo:path x:x + _penX y:y + _penY];
}

- (void)lineTo:(CGMutablePathRef)path x:(float)x y:(float)y{
    [self setPenDown];
    _pivotX = _penX = x;
    _pivotY = _penY = y;
    CGPathAddLineToPoint(path, nil, x, y);

    NSValue * destination = [NSValue valueWithCGPoint:CGPointMake(x, y)];
    [_bezierCurves addObject: @[destination, destination, destination]];
}

- (void)curve:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y c2x:(float)c2x c2y:(float)c2y ex:(float)ex ey:(float)ey
{
    [self curveTo:path c1x:c1x + _penX
              c1y:c1y + _penY
              c2x:c2x + _penX
              c2y:c2y + _penY
               ex:ex + _penX
               ey:ey + _penY];
}

- (void)curveTo:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y c2x:(float)c2x c2y:(float)c2y ex:(float)ex ey:(float)ey
{
    _pivotX = c2x;
    _pivotY = c2y;
    [self curveToPoint:path c1x:(float)c1x c1y:(float)c1y c2x:(float)c2x c2y:(float)c2y ex:(float)ex ey:(float)ey];
}

- (void)curveToPoint:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y c2x:(float)c2x c2y:(float)c2y ex:(float)ex ey:(float)ey
{
    [self setPenDown];
    _penX = ex;
    _penY = ey;
    CGPathAddCurveToPoint(path, nil, c1x, c1y, c2x, c2y, ex, ey);

    [_bezierCurves addObject: @[
                          [NSValue valueWithCGPoint:CGPointMake(c1x, c1y)],
                          [NSValue valueWithCGPoint:CGPointMake(c2x, c2y)],
                          [NSValue valueWithCGPoint:CGPointMake(ex, ey)]
                          ]];
}

- (void)smoothCurve:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y ex:(float)ex ey:(float)ey
{
    [self smoothCurveTo:path c1x:c1x + _penX c1y:c1y + _penY ex:ex + _penX ey:ey + _penY];
}

- (void)smoothCurveTo:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y ex:(float)ex ey:(float)ey
{
    float c2x = c1x;
    float c2y = c1y;
    c1x = (_penX * 2) - _pivotX;
    c1y = (_penY * 2) - _pivotY;
    _pivotX = c2x;
    _pivotY = c2y;
    [self curveToPoint:path c1x:(float)c1x c1y:(float)c1y c2x:(float)c2x c2y:(float)c2y ex:(float)ex ey:(float)ey];
}

- (void)quadraticBezierCurve:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y c2x:(float)c2x c2y:(float)c2y
{
    [self quadraticBezierCurveTo:path c1x:(float)c1x + _penX c1y:(float)c1y + _penY c2x:(float)c2x + _penX c2y:(float)c2y + _penY];
}

- (void)quadraticBezierCurveTo:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y c2x:(float)c2x c2y:(float)c2y
{
    _pivotX = c1x;
    _pivotY = c1y;
    float ex = c2x;
    float ey = c2y;
    c2x = (ex + c1x * 2) / 3;
    c2y = (ey + c1y * 2) / 3;
    c1x = (_penX + c1x * 2) / 3;
    c1y = (_penY + c1y * 2) / 3;
    [self curveToPoint:path c1x:(float)c1x c1y:(float)c1y c2x:(float)c2x c2y:(float)c2y ex:(float)ex ey:(float)ey];
}

- (void)smoothQuadraticBezierCurve:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y
{
    [self smoothQuadraticBezierCurveTo:path c1x:c1x + _penX c1y:c1y + _penY];
}

- (void)smoothQuadraticBezierCurveTo:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y
{
    float c2x = c1x;
    float c2y = c1y;
    c1x = (_penX * 2) - _pivotX;
    c1y = (_penY * 2) - _pivotY;
    [self quadraticBezierCurveTo:path c1x:c1x c1y:c1y c2x:c2x c2y:c2y];
}

- (void)arc:(CGMutablePathRef)path rx:(float)rx ry:(float)ry rotation:(float)rotation outer:(BOOL)outer clockwise:(BOOL)clockwise x:(float)x y:(float)y
{
    [self arcTo:path rx:rx ry:ry rotation:rotation outer:outer clockwise:clockwise x:x + _penX y:y + _penY];
}

- (void)arcTo:(CGMutablePathRef)path rx:(float)rx ry:(float)ry rotation:(float)rotation outer:(BOOL)outer clockwise:(BOOL)clockwise x:(float)x y:(float)y
{
    float tX = _penX;
    float tY = _penY;

    ry = fabsf(ry == 0 ? (rx == 0 ? (y - tY) : rx) : ry);
    rx = fabsf(rx == 0 ? (x - tX) : rx);

    if (rx == 0 || ry == 0 || (x == tX && y == tY)) {
        [self lineTo:path x:x y:y];
        return;
    }


    float rad = rotation * M_PI / 180;
    float cosed = cosf(rad);
    float sined = sinf(rad);
    x -= tX;
    y -= tY;
    // Ellipse Center
    float cx = cosed * x / 2 + sined * y / 2;
    float cy = -sined * x / 2 + cosed * y / 2;
    float rxry = rx * rx * ry * ry;
    float rycx = ry * ry * cx * cx;
    float rxcy = rx * rx * cy * cy;
    float a = rxry - rxcy - rycx;

    if (a < 0){
        a = sqrtf(1 - a / rxry);
        rx *= a;
        ry *= a;
        cx = x / 2;
        cy = y / 2;
    } else {
        a = sqrtf(a / (rxcy + rycx));

        if (outer == clockwise) {
            a = -a;
        }
        float cxd = -a * cy * rx / ry;
        float cyd =  a * cx * ry / rx;
        cx = cosed * cxd - sined * cyd + x / 2;
        cy = sined * cxd + cosed * cyd + y / 2;
    }

    // Rotation + Scale Transform
    float xx =  cosed / rx;
    float yx = sined / rx;
    float xy = -sined / ry;
    float yy = cosed / ry;

    // Start and End Angle
    float sa = atan2f(xy * -cx + yy * -cy, xx * -cx + yx * -cy);
    float ea = atan2f(xy * (x - cx) + yy * (y - cy), xx * (x - cx) + yx * (y - cy));

    cx += tX;
    cy += tY;
    x += tX;
    y += tY;

    [self setPenDown];

    _penX = _pivotX = x;
    _penY = _pivotY = y;

    [self arcToBezier:path cx:cx cy:cy rx:rx ry:ry sa:sa ea:ea clockwise:clockwise rad:rad];
}

- (void)arcToBezier:(CGMutablePathRef)path cx:(float)cx cy:(float)cy rx:(float)rx ry:(float)ry sa:(float)sa ea:(float)ea clockwise:(BOOL)clockwise rad:(float)rad
{
    // Inverse Rotation + Scale Transform
    float cosed = cosf(rad);
    float sined = sinf(rad);
    float xx = cosed * rx;
    float yx = -sined * ry;
    float xy = sined * rx;
    float yy =  cosed * ry;

    // Bezier Curve Approximation
    float arc = ea - sa;
    if (arc < 0 && clockwise) {
        arc += M_PI * 2;
    } else if (arc > 0 && !clockwise) {
        arc -= M_PI * 2;
    }

    int n = ceilf(fabsf(arc / ((float)M_PI / 2)));

    float step = arc / n;
    float k = (4.0f / 3.0f) * tanf(step / 4);

    float x = cosf(sa);
    float y = sinf(sa);

    for (int i = 0; i < n; i++){
        float cp1x = x - k * y;
        float cp1y = y + k * x;

        sa += step;
        x = cosf(sa);
        y = sinf(sa);

        float cp2x = x + k * y;
        float cp2y = y - k * x;

        CGPathAddCurveToPoint(path,
                              nil,
                              cx + xx * cp1x + yx * cp1y,
                              cy + xy * cp1x + yy * cp1y,
                              cx + xx * cp2x + yx * cp2y,
                              cy + xy * cp2x + yy * cp2y,
                              cx + xx * x + yx * y,
                              cy + xy * x + yy * y);
    }
}

- (void)close:(CGMutablePathRef)path
{
    if (_penDownSet) {
        _penX = _penDownX;
        _penY = _penDownY;
        _penDownSet = NO;
        CGPathCloseSubpath(path);
        [_bezierCurves addObject: @[_lastStartPoint, _lastStartPoint, _lastStartPoint]];
    }
}

- (void)setPenDown
{
    if (!_penDownSet) {
        _penDownX = _penX;
        _penDownY = _penY;
        _penDownSet = YES;
    }
}

@end
