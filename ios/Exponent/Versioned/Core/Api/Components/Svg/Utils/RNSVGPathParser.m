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
#import "RNSVGBezierElement.h"

@implementation RNSVGPathParser
{
    char prev_cmd;
    NSUInteger i;
    NSUInteger l;
    NSString* s;
    float _penX;
    float _penY;
    float _penDownX;
    float _penDownY;
    float _pivotX;
    float _pivotY;
    BOOL _valid;
    BOOL _penDownSet;
}

- (instancetype)initWithPathString:(NSString *)d
{
    if (self = [super init]) {
        prev_cmd = ' ';
        l = [d length];
        i = 0;
        s = d;
    }
    return self;
}

#define NEXT_FLOAT [self parse_list_number]
#define NEXT_BOOL [self parse_flag]

- (CGPathRef)getPath
{
    CGMutablePathRef path = CGPathCreateMutable();
    while (i < l) {
        [self skip_spaces];

        if (i >= l) {
            break;
        }

        bool has_prev_cmd = prev_cmd != ' ';
        char first_char = [s characterAtIndex:i];

        if (!has_prev_cmd && first_char != 'M' && first_char != 'm') {
            // The first segment must be a MoveTo.
            RCTLogError(@"UnexpectedData: %@", s);
            CGPathRelease(path);
            return nil;
        }

        // TODO: simplify
        bool is_implicit_move_to = false;
        char cmd = ' ';
        if ([self is_cmd:first_char]) {
            is_implicit_move_to = false;
            cmd = first_char;
            i += 1;
        } else if ([self is_number_start:first_char] && has_prev_cmd) {
            if (prev_cmd == 'Z' || prev_cmd == 'z') {
                // ClosePath cannot be followed by a number.
                RCTLogError(@"UnexpectedData: %@", s);
                CGPathRelease(path);
                return nil;
            }

            if (prev_cmd == 'M' || prev_cmd == 'm') {
                // 'If a moveto is followed by multiple pairs of coordinates,
                // the subsequent pairs are treated as implicit lineto commands.'
                // So we parse them as LineTo.
                is_implicit_move_to = true;
                if ([self is_absolute:prev_cmd]) {
                    cmd = 'L';
                } else {
                    cmd = 'l';
                }
            } else {
                is_implicit_move_to = false;
                cmd = prev_cmd;
            }
        } else {
            RCTLogError(@"UnexpectedData: %@", s);
            CGPathRelease(path);
            return nil;
        }

        bool absolute = [self is_absolute:cmd];
        switch (cmd) {
            case 'm': {
                [self move:path x:NEXT_FLOAT y:NEXT_FLOAT];
                break;
            }
            case 'M': {
                [self moveTo:path x:NEXT_FLOAT y:NEXT_FLOAT];
                break;
            }
            case 'l': {
                [self line:path x:NEXT_FLOAT y:NEXT_FLOAT];
                break;
            }
            case 'L': {
                [self lineTo:path x:NEXT_FLOAT y:NEXT_FLOAT];
                break;
            }
            case 'h': {
                [self line:path x:NEXT_FLOAT y:0];
                break;
            }
            case 'H': {
                [self lineTo:path x:NEXT_FLOAT y:_penY];
                break;
            }
            case 'v': {
                [self line:path x:0 y:NEXT_FLOAT];
                break;
            }
            case 'V': {
                [self lineTo:path x:_penX y:NEXT_FLOAT];
                break;
            }
            case 'c': {
                [self curve:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT c2x:NEXT_FLOAT c2y:NEXT_FLOAT ex:NEXT_FLOAT ey:NEXT_FLOAT];
                break;
            }
            case 'C': {
                [self curveTo:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT c2x:NEXT_FLOAT c2y:NEXT_FLOAT ex:NEXT_FLOAT ey:NEXT_FLOAT];
                break;
            }
            case 's': {
                [self smoothCurve:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT ex:NEXT_FLOAT ey:NEXT_FLOAT];
                break;
            }
            case 'S': {
                [self smoothCurveTo:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT ex:NEXT_FLOAT ey:NEXT_FLOAT];
                break;
            }
            case 'q': {
                [self quadraticBezierCurve:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT c2x:NEXT_FLOAT c2y:NEXT_FLOAT];
                break;
            }
            case 'Q': {
                [self quadraticBezierCurveTo:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT c2x:NEXT_FLOAT c2y:NEXT_FLOAT];
                break;
            }
            case 't': {
                [self smoothQuadraticBezierCurve:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT];
                break;
            }
            case 'T': {
                [self smoothQuadraticBezierCurveTo:path c1x:NEXT_FLOAT c1y:NEXT_FLOAT];
                break;
            }
            case 'a': {
                [self arc:path rx:NEXT_FLOAT ry:NEXT_FLOAT rotation:NEXT_FLOAT outer:NEXT_BOOL clockwise:NEXT_BOOL x:NEXT_FLOAT y:NEXT_FLOAT];
                break;
            }
            case 'A': {
                [self arcTo:path rx:NEXT_FLOAT ry:NEXT_FLOAT rotation:NEXT_FLOAT outer:NEXT_BOOL clockwise:NEXT_BOOL x:NEXT_FLOAT y:NEXT_FLOAT];
                break;
            }
            case 'z':
            case 'Z': {
                [self close:path];
                break;
            }
            default: {
                RCTLogError(@"UnexpectedData: %@", s);
                CGPathRelease(path);
                return nil;
            }
        }


        if (is_implicit_move_to) {
            if (absolute) {
                prev_cmd = 'M';
            } else {
                prev_cmd = 'm';
            }
        } else {
            prev_cmd = cmd;
        }

    }

    return (CGPathRef)CFAutorelease(path);
}

- (void)move:(CGMutablePathRef)path x:(float)x y:(float)y
{
    [self moveTo:path x:x + _penX y:y + _penY];
}

- (void)moveTo:(CGMutablePathRef)path x:(float)x y:(float)y
{
    //RCTLogInfo(@"move x: %f y: %f", x, y);
    _penDownX = _pivotX = _penX = x;
    _penDownY = _pivotY = _penY = y;
    CGPathMoveToPoint(path, nil, x, y);
}

- (void)line:(CGMutablePathRef)path x:(float)x y:(float)y
{
    [self lineTo:path x:x + _penX y:y + _penY];
}

- (void)lineTo:(CGMutablePathRef)path x:(float)x y:(float)y{
    //RCTLogInfo(@"line x: %f y: %f", x, y);
    [self setPenDown];
    _pivotX = _penX = x;
    _pivotY = _penY = y;
    CGPathAddLineToPoint(path, nil, x, y);
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
    //RCTLogInfo(@"curve c1x: %f c1y: %f c2x: %f c2y: %f ex: %f ey: %f", c1x, c1y, c2x, c2y, ex, ey);
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
}

- (void)smoothCurve:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y ex:(float)ex ey:(float)ey
{
    [self smoothCurveTo:path c1x:c1x + _penX c1y:c1y + _penY ex:ex + _penX ey:ey + _penY];
}

- (void)smoothCurveTo:(CGMutablePathRef)path c1x:(float)c1x c1y:(float)c1y ex:(float)ex ey:(float)ey
{
    //RCTLogInfo(@"smoothcurve c1x: %f c1y: %f ex: %f ey: %f", c1x, c1y, ex, ey);
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
    //RCTLogInfo(@"quad c1x: %f c1y: %f c2x: %f c2y: %f", c1x, c1y, c2x, c2y);
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
    //RCTLogInfo(@"smoothquad c1x: %f c1y: %f", c1x, c1y);
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
    //RCTLogInfo(@"arc rx: %f ry: %f rotation: %f outer: %i clockwise: %i x: %f y: %f", rx, ry, rotation, outer, clockwise, x, y);
    float tX = _penX;
    float tY = _penY;

    ry = fabsf(ry == 0 ? (rx == 0 ? (y - tY) : rx) : ry);
    rx = fabsf(rx == 0 ? (x - tX) : rx);

    if (rx == 0 || ry == 0 || (x == tX && y == tY)) {
        [self lineTo:path x:x y:y];
        return;
    }


    float rad = rotation * (float)M_PI / 180;
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

    int n = (int)ceilf(fabsf(arc / ((float)M_PI / 2)));

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

        float c1x = cx + xx * cp1x + yx * cp1y;
        float c1y = cy + xy * cp1x + yy * cp1y;
        float c2x = cx + xx * cp2x + yx * cp2y;
        float c2y = cy + xy * cp2x + yy * cp2y;
        float ex = cx + xx * x + yx * y;
        float ey = cy + xy * x + yy * y;
        CGPathAddCurveToPoint(path, nil, c1x, c1y, c2x, c2y, ex, ey);
    }
}

- (void)close:(CGMutablePathRef)path
{
    if (_penDownSet) {
        _penX = _penDownX;
        _penY = _penDownY;
        _penDownSet = NO;
        CGPathCloseSubpath(path);
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

- (void)skip_spaces {
    while (i < l && [[NSCharacterSet whitespaceAndNewlineCharacterSet] characterIsMember:[s characterAtIndex:i]]) i++;
}

- (bool)is_cmd:(char)c {
    switch (c) {
        case 'M':
        case 'm':
        case 'Z':
        case 'z':
        case 'L':
        case 'l':
        case 'H':
        case 'h':
        case 'V':
        case 'v':
        case 'C':
        case 'c':
        case 'S':
        case 's':
        case 'Q':
        case 'q':
        case 'T':
        case 't':
        case 'A':
        case 'a':
            return true;
    }
    return false;
}

- (bool)is_number_start:(char)c {
    return (c >= '0' && c <= '9') || c == '.' || c == '-' || c == '+';
}

- (bool)is_absolute:(char)c {
    return [[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:c];
}

// By the SVG spec 'large-arc' and 'sweep' must contain only one char
// and can be written without any separators, e.g.: 10 20 30 01 10 20.
- (bool)parse_flag {
    [self skip_spaces];

    char c = [s characterAtIndex:i];
    switch (c) {
        case '0':
        case '1': {
            i += 1;
            if (i < l && [s characterAtIndex:i] == ',') {
                i += 1;
            }
            [self skip_spaces];
            break;
        }
        default:
            RCTLogError(@"UnexpectedData: %@", s);
    }

    return c == '1';
}

- (float)parse_list_number {
    if (i == l) {
        RCTLogError(@"UnexpectedEnd: %@", s);
    }

    float n = [self parse_number];
    [self skip_spaces];
    [self parse_list_separator];

    return n;
}

- (float)parse_number {
    // Strip off leading whitespaces.
    [self skip_spaces];

    if (i == l) {
        RCTLogError(@"InvalidNumber: %@", s);
    }

    NSUInteger start = i;

    char c = [s characterAtIndex:i];

    // Consume sign.
    if (c == '-' || c == '+') {
        i += 1;
        c = [s characterAtIndex:i];
    }

    // Consume integer.
    if (c >= '0' && c <= '9') {
        [self skip_digits];
        if (i < l) {
            c = [s characterAtIndex:i];
        }
    } else if (c != '.') {
        RCTLogError(@"InvalidNumber: %@", s);
    }

    // Consume fraction.
    if (c == '.') {
        i += 1;
        [self skip_digits];
        if (i < l) {
            c = [s characterAtIndex:i];
        }
    }

    if ((c == 'e' || c == 'E') && i + 1 < l) {
        char c2 = [s characterAtIndex:i + 1];
        // Check for `em`/`ex`.
        if (c2 != 'm' && c2 != 'x') {
            i += 1;
            c = [s characterAtIndex:i];

            if (c == '+' || c == '-') {
                i += 1;
                [self skip_digits];
            } else if (c >= '0' && c <= '9') {
                [self skip_digits];
            } else {
                RCTLogError(@"InvalidNumber: %@", s);
            }
        }
    }

    NSString* num = [s substringWithRange:NSMakeRange(start, i - start)];
    float n = [num floatValue];

    // inf, nan, etc. are an error.
    if (!isfinite(n)) {
        RCTLogError(@"InvalidNumber: %@", s);
    }

    return n;
}

- (void)parse_list_separator {
    if (i < l && [s characterAtIndex:i] == ',') {
        i += 1;
    }
}

- (void)skip_digits {
    while (i < l && [[NSCharacterSet decimalDigitCharacterSet] characterIsMember:[s characterAtIndex:i]]) i++;
}

@end

