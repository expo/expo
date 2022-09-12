#import "RNSVGPathMeasure.h"
#import "RNSVGBezierElement.h"

/* Some Bezier logic from PerformanceBezier */
/*

 ## License

 <a rel="license" href="http://creativecommons.org/licenses/by/3.0/us/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/3.0/us/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/3.0/us/">Creative Commons Attribution 3.0 United States License</a>.

 For attribution, please include:

 1. Mention original author "Adam Wulf for Loose Leaf app"
 2. Link to https://getlooseleaf.com/opensource/
 3. Link to https://github.com/adamwulf/PerformanceBezier

 */
static CGFloat idealFlatness = (CGFloat).01;

/**
 * returns the distance between two points
 */
static CGFloat distance(CGPoint p1, CGPoint p2)
{
    CGFloat dx = p2.x - p1.x;
    CGFloat dy = p2.y - p1.y;
    return hypot(dx, dy);
}

// Subdivide a Bézier (specific division)
/*
 * (c) 2004 Alastair J. Houghton
 * All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   1. Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *   2. Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *   3. The name of the author of this software may not be used to endorse
 *      or promote products derived from the software without specific prior
 *      written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT OWNER BE LIABLE FOR ANY DIRECT, INDIRECT,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */
static void subdivideBezierAtT(const CGPoint bez[4], CGPoint bez1[4], CGPoint bez2[4], CGFloat t)
{
    CGPoint q;
    CGFloat mt = 1 - t;

    bez1[0].x = bez[0].x;
    bez1[0].y = bez[0].y;
    bez2[3].x = bez[3].x;
    bez2[3].y = bez[3].y;

    q.x = mt * bez[1].x + t * bez[2].x;
    q.y = mt * bez[1].y + t * bez[2].y;
    bez1[1].x = mt * bez[0].x + t * bez[1].x;
    bez1[1].y = mt * bez[0].y + t * bez[1].y;
    bez2[2].x = mt * bez[2].x + t * bez[3].x;
    bez2[2].y = mt * bez[2].y + t * bez[3].y;

    bez1[2].x = mt * bez1[1].x + t * q.x;
    bez1[2].y = mt * bez1[1].y + t * q.y;
    bez2[1].x = mt * q.x + t * bez2[2].x;
    bez2[1].y = mt * q.y + t * bez2[2].y;

    bez1[3].x = bez2[0].x = mt * bez1[2].x + t * bez2[1].x;
    bez1[3].y = bez2[0].y = mt * bez1[2].y + t * bez2[1].y;
}

@implementation RNSVGPathMeasure

- (void)addLine:(CGPoint *)last next:(const CGPoint *)next {
    NSArray *line = @[[NSValue valueWithCGPoint:*last], [NSValue valueWithCGPoint:*next]];
    _pathLength += distance(*last, *next);
    [_lengths addObject:[NSNumber numberWithDouble:_pathLength]];
    [_lines addObject:line];
    *last = *next;
}

- (void)reset {
    _lengths = nil;
    _lines = nil;
    _isClosed = NO;
    _lineCount = 0;
    _pathLength = 0;
    _path = nil;
}

- (void)extractPathData:(CGPathRef)path {
    if (path == _path) {
        return;
    }
    _path = path;
    CGPoint origin = CGPointMake (0.0, 0.0);
    CGPoint last = CGPointMake (0.0, 0.0);
    _lengths = [NSMutableArray array];
    _lines = [NSMutableArray array];
    _isClosed = NO;
    _lineCount = 0;
    _pathLength = 0;
    NSArray *elements = [RNSVGBezierElement elementsFromCGPath:path];
    for (RNSVGBezierElement *element in elements) {
        switch (element.elementType)
        {
            case kCGPathElementMoveToPoint:
                origin = last = element.point;
                break;

            case kCGPathElementAddLineToPoint: {
                CGPoint next = element.point;
                [self addLine:&last next:&next];
                _lineCount++;
                break;
            }
            case kCGPathElementAddQuadCurveToPoint:
            case kCGPathElementAddCurveToPoint:
            {
                // handle both curve types gracefully
                CGPoint curveTo = element.point;
                CGPoint ctrl1 = element.controlPoint1;
                CGPoint ctrl2 = element.elementType == kCGPathElementAddQuadCurveToPoint ? ctrl1 : element.controlPoint2;

                // this is the bezier for our current element
                CGPoint bezier[4] = { last, ctrl1, ctrl2, curveTo };
                NSValue *arr = [NSValue valueWithBytes:&bezier objCType:@encode(CGPoint[4])];
                NSMutableArray *curves = [NSMutableArray arrayWithObjects:arr, nil];

                for (NSInteger curveIndex = 0; curveIndex >= 0; curveIndex--) {
                    CGPoint bez[4];
                    [curves[curveIndex] getValue:&bez];
                    [curves removeLastObject];

                    // calculate the error rate of the curve vs
                    // a line segment between the start and end points
                    CGPoint ctrl1 = bez[1];
                    CGPoint ctrl2 = bez[2];
                    CGPoint next = bez[3];
                    CGFloat polyLen =
                        distance(last, ctrl1) +
                        distance(ctrl1, ctrl2) +
                        distance(ctrl2, next);
                    CGFloat chordLen = distance(last, next);
                    CGFloat error = polyLen - chordLen;

                    // if the error is less than our accepted level of error
                    // then add a line, else, split the curve in half
                    if (error <= idealFlatness) {
                        [self addLine:&last next:&next];
                        _lineCount++;
                    } else {
                        CGPoint bez1[4], bez2[4];
                        subdivideBezierAtT(bez, bez1, bez2, .5);
                        [curves addObject:[NSValue valueWithBytes:&bez2 objCType:@encode(CGPoint[4])]];
                        [curves addObject:[NSValue valueWithBytes:&bez1 objCType:@encode(CGPoint[4])]];
                        curveIndex += 2;
                    }
                }
                break;
            }

            case kCGPathElementCloseSubpath: {
                CGPoint next = origin;
                [self addLine:&last next:&next];
                _lineCount++;
                _isClosed = YES;
                break;
            }

            default:
                break;
        }
    }
}

- (void)getPosAndTan:(CGFloat *)angle midPoint:(CGFloat)midPoint x:(CGFloat *)x y:(CGFloat *)y {
    // Investigation suggests binary search is faster at lineCount >= 16
    // https://gist.github.com/msand/4c7993319425f9d7933be58ad9ada1a4
    NSUInteger i = _lineCount < 16 ?
    [_lengths
     indexOfObjectPassingTest:^(NSNumber* length, NSUInteger index, BOOL * _Nonnull stop) {
         BOOL contains = midPoint <= [length doubleValue];
         return contains;
     }]
    :
    [_lengths
     indexOfObject:[NSNumber numberWithDouble:midPoint]
     inSortedRange:NSMakeRange(0, _lineCount)
     options:NSBinarySearchingInsertionIndex
     usingComparator:^(NSNumber* obj1, NSNumber* obj2) {
         return [obj1 compare:obj2];
     }];

    CGFloat totalLength = (CGFloat)[_lengths[i] doubleValue];
    CGFloat prevLength = i == 0 ? 0 : (CGFloat)[_lengths[i - 1] doubleValue];

    CGFloat length = totalLength - prevLength;
    CGFloat percent = (midPoint - prevLength) / length;

    NSArray * points = [_lines objectAtIndex: i];
    CGPoint p1 = [[points objectAtIndex: 0] CGPointValue];
    CGPoint p2 = [[points objectAtIndex: 1] CGPointValue];

    CGFloat ldx = p2.x - p1.x;
    CGFloat ldy = p2.y - p1.y;
    *angle = atan2(ldy, ldx);
    *x = p1.x + ldx * percent;
    *y = p1.y + ldy * percent;
}

@end
