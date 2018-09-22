//
//  LOTBezierPath.m
//  Lottie
//
//  Created by brandon_withrow on 7/20/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTBezierPath.h"
#import "CGGeometry+LOTAdditions.h"

typedef struct LOT_Subpath LOT_Subpath;
typedef void(^LOTBezierPathEnumerationHandler)(const CGPathElement *element);

struct LOT_Subpath {
  CGPathElementType type;
  CGFloat length;
  CGPoint endPoint;
  CGPoint controlPoint1;
  CGPoint controlPoint2;
  LOT_Subpath *nextSubpath;
};

@interface LOTBezierPath ()
@property (nonatomic, readonly) LOT_Subpath *headSubpath;
@end

@implementation LOTBezierPath {
  LOT_Subpath *headSubpath_;
  LOT_Subpath *tailSubpath_;
  CGPoint subpathStartPoint_;
  CGFloat *_lineDashPattern;
  NSInteger _lineDashCount;
  CGFloat _lineDashPhase;
  CGMutablePathRef _path;
}

// MARK - Lifecycle

+ (instancetype)pathWithCGPath:(CGPathRef)path {
  LOTBezierPath *returnPath = [LOTBezierPath newPath];
  [returnPath setWithCGPath:path];
  return returnPath;
}

+ (instancetype)newPath {
  return [[LOTBezierPath alloc] init];
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _length = 0;
    headSubpath_ = NULL;
    tailSubpath_ = NULL;
    _path = CGPathCreateMutable();
    _lineWidth = 1;
    _lineCapStyle = kCGLineCapButt;
    _lineJoinStyle = kCGLineJoinMiter;
    _miterLimit = 10;
    _flatness = 0.6;
    _usesEvenOddFillRule = NO;
    _lineDashPattern = NULL;
    _lineDashCount = 0;
    _lineDashPhase = 0;
    _cacheLengths = NO;
  }
  return self;
}

- (void)dealloc {
  [self removeAllSubpaths];
  if (_path) CGPathRelease(_path);
}

- (id)copyWithZone:(NSZone *)zone {
  LOTBezierPath *copy = [[self class] new];
  
  copy.cacheLengths = self.cacheLengths;
  copy.lineWidth = self.lineWidth;
  copy.lineCapStyle = self.lineCapStyle;
  copy.lineJoinStyle = self.lineJoinStyle;
  copy.miterLimit = self.miterLimit;
  copy.flatness = self.flatness;
  copy.usesEvenOddFillRule = self.usesEvenOddFillRule;
  
  [copy LOT_appendPath:self];
  
  return copy;
}

// MARK - Subpaths List

- (void)removeAllSubpaths {
  LOT_Subpath *node = headSubpath_;
  while (node) {
    LOT_Subpath *nextNode = node->nextSubpath;
    node->nextSubpath = NULL;
    free(node);
    node = nextNode;
  }
  headSubpath_ = NULL;
  tailSubpath_ = NULL;
}

- (void)addSubpathWithType:(CGPathElementType)type
                    length:(CGFloat)length
                  endPoint:(CGPoint)endPoint
             controlPoint1:(CGPoint)controlPoint1
             controlPoint1:(CGPoint)controlPoint2 {
  LOT_Subpath *subPath = (LOT_Subpath *)malloc(sizeof(LOT_Subpath));
  subPath->type = type;
  subPath->length = length;
  subPath->endPoint = endPoint;
  subPath->controlPoint1 = controlPoint1;
  subPath->controlPoint2 = controlPoint2;
  subPath->nextSubpath = NULL;
  if (tailSubpath_ == NULL) {
    headSubpath_ = subPath;
    tailSubpath_ = subPath;
  } else {
    tailSubpath_->nextSubpath = subPath;
    tailSubpath_ = subPath;
  }
}

// MARK Getters Setters

- (CGPoint)currentPoint {
  CGPoint previousPoint = tailSubpath_ ? tailSubpath_->endPoint : CGPointZero;
  return previousPoint;
}

- (CGPathRef)CGPath {
  return _path;
}

- (LOT_Subpath *)headSubpath {
  return headSubpath_;
}

// MARK - External

- (void)LOT_moveToPoint:(CGPoint)point {
  subpathStartPoint_ = point;
  [self addSubpathWithType:kCGPathElementMoveToPoint length:0 endPoint:point controlPoint1:CGPointZero controlPoint1:CGPointZero];
  CGPathMoveToPoint(_path, NULL, point.x, point.y);
}

- (void)LOT_addLineToPoint:(CGPoint)point {
  CGFloat length = 0;
  if (_cacheLengths) {
    length = LOT_PointDistanceFromPoint(self.currentPoint, point);
    _length = _length + length;
  }
  [self addSubpathWithType:kCGPathElementAddLineToPoint length:length endPoint:point controlPoint1:CGPointZero controlPoint1:CGPointZero];
  CGPathAddLineToPoint(_path, NULL, point.x, point.y);
}

- (void)LOT_addCurveToPoint:(CGPoint)point
              controlPoint1:(CGPoint)cp1
              controlPoint2:(CGPoint)cp2 {
  CGFloat length = 0;
  if (_cacheLengths) {
    length = LOT_CubicLengthWithPrecision(self.currentPoint, point, cp1, cp2, 5);
    _length = _length + length;
  }
  [self addSubpathWithType:kCGPathElementAddCurveToPoint length:length endPoint:point controlPoint1:cp1 controlPoint1:cp2];
  CGPathAddCurveToPoint(_path, NULL, cp1.x, cp1.y, cp2.x, cp2.y, point.x, point.y);
}

- (void)LOT_closePath {
  CGFloat length = 0;
  if (_cacheLengths) {
    length = LOT_PointDistanceFromPoint(self.currentPoint, subpathStartPoint_);
    _length = _length + length;
  }
  [self addSubpathWithType:kCGPathElementCloseSubpath length:length endPoint:subpathStartPoint_ controlPoint1:CGPointZero controlPoint1:CGPointZero];
  CGPathCloseSubpath(_path);
}

- (void)_clearPathData {
  _length = 0;
  subpathStartPoint_ = CGPointZero;
  CGPathRelease(_path);
  _path = CGPathCreateMutable();
}

- (void)LOT_removeAllPoints {
  [self removeAllSubpaths];
  [self _clearPathData];
}

- (BOOL)containsPoint:(CGPoint)point {
  return CGPathContainsPoint(_path, NULL, point, _usesEvenOddFillRule);
}

- (BOOL)isEmpty {
  return CGPathIsEmpty(_path);
}

- (CGRect)bounds {
  return CGPathGetBoundingBox(_path);
}

- (void)LOT_applyTransform:(CGAffineTransform)transform {
  CGMutablePathRef mutablePath = CGPathCreateMutable();
  CGPathAddPath(mutablePath, &transform, _path);
  CGPathRelease(_path);
  _path = mutablePath;
}

- (void)LOT_appendPath:(LOTBezierPath *)bezierPath {
  CGPathAddPath(_path, NULL, bezierPath.CGPath);
  
  LOT_Subpath *nextSubpath = bezierPath.headSubpath;
  while (nextSubpath) {
    CGFloat length = 0;
    if (self.cacheLengths) {
      if (bezierPath.cacheLengths) {
        length = nextSubpath->length;
      } else {
        // No previous length data, measure.
        if (nextSubpath->type == kCGPathElementAddLineToPoint) {
          length = LOT_PointDistanceFromPoint(self.currentPoint, nextSubpath->endPoint);
        } else if (nextSubpath->type == kCGPathElementAddCurveToPoint) {
          length = LOT_CubicLengthWithPrecision(self.currentPoint, nextSubpath->endPoint, nextSubpath->controlPoint1, nextSubpath->controlPoint2, 5);
        } else if (nextSubpath->type == kCGPathElementCloseSubpath) {
          length = LOT_PointDistanceFromPoint(self.currentPoint, nextSubpath->endPoint);
        }
      }
    }
    _length = _length + length;
    [self addSubpathWithType:nextSubpath->type
                      length:length
                    endPoint:nextSubpath->endPoint
               controlPoint1:nextSubpath->controlPoint1
               controlPoint1:nextSubpath->controlPoint2];
    
    nextSubpath = nextSubpath->nextSubpath;
  }
}

- (void)trimPathFromT:(CGFloat)fromT toT:(CGFloat)toT offset:(CGFloat)offset {
  fromT = MIN(MAX(0, fromT), 1);
  toT = MIN(MAX(0, toT), 1);
  if (fromT > toT) {
    CGFloat to = fromT;
    fromT = toT;
    toT = to;
  }
  
  offset = offset - floor(offset);
  CGFloat fromLength = fromT + offset;
  CGFloat toLength = toT + offset;
  
  if (toT - fromT == 1) {
    // Do Nothing, Full Path returned.
    return;
  }
  
  if (fromLength == toLength) {
    // Empty Path
    [self LOT_removeAllPoints];
    return;
  }
  
  if (fromLength >= 1) {
    fromLength = fromLength - floor(fromLength);
  }
  if (toLength > 1) {
    toLength = toLength - floor(toLength);
  }
  
  if (fromLength == 0 &&
      toLength == 1) {
    // Do Nothing. Full Path returned.
    return;
  }
  
  if (fromLength == toLength) {
    // Empty Path
    [self LOT_removeAllPoints];
    return;
  }
  
  CGFloat totalLength = _length;
  
  [self _clearPathData];

  LOT_Subpath *subpath = headSubpath_;
  headSubpath_ = NULL;
  tailSubpath_ = NULL;
  
  fromLength = fromLength * totalLength;
  toLength = toLength * totalLength;
  
  CGFloat currentStartLength = fromLength < toLength ? fromLength : 0;
  CGFloat currentEndLength = toLength;

  CGFloat subpathBeginningLength = 0;
  CGPoint currentPoint = CGPointZero;

  while (subpath) {
    
    CGFloat pathLength = subpath->length;
    if (!_cacheLengths) {
      if (subpath->type == kCGPathElementAddLineToPoint) {
        pathLength = LOT_PointDistanceFromPoint(currentPoint, subpath->endPoint);
      } else if (subpath->type == kCGPathElementAddCurveToPoint) {
        pathLength = LOT_CubicLengthWithPrecision(currentPoint, subpath->endPoint, subpath->controlPoint1, subpath->controlPoint2, 5);
      } else if (subpath->type == kCGPathElementCloseSubpath) {
        pathLength = LOT_PointDistanceFromPoint(currentPoint, subpath->endPoint);
      }
    }
    CGFloat subpathEndLength = subpathBeginningLength + pathLength;

    if (subpath->type != kCGPathElementMoveToPoint &&
        subpathEndLength > currentStartLength) {
      // The end of this path overlaps the current drawing region
      
      // x                    x                                 x                          x
      // ---------------ooooooooooooooooooooooooooooooooooooooooooooooooo-------------------
      // Start          |currentStartLength             currentEndLength|                End
      
      CGFloat currentSpanStartT = LOT_RemapValue(currentStartLength, subpathBeginningLength, subpathEndLength, 0, 1);
      CGFloat currentSpanEndT = LOT_RemapValue(currentEndLength, subpathBeginningLength, subpathEndLength, 0, 1);
      
      // At this point currentSpan start and end T can be less than 0 or greater than 1
      
      if (subpath->type == kCGPathElementAddLineToPoint) {
        
        if (currentSpanStartT >= 0) {
          // The current drawable span either starts with this subpath or along this subpath.
          // If this is the middle of a segment then currentSpanStartT would be less than 0
          if (currentSpanStartT > 0) {
            currentPoint = LOT_PointInLine(currentPoint, subpath->endPoint, currentSpanStartT);
          }
          [self LOT_moveToPoint:currentPoint];
          // Now we are ready to draw a line
        }
        
        CGPoint toPoint = subpath->endPoint;
        if (currentSpanEndT < 1) {
          // The end of the span is inside of the current subpath. Find it.
          toPoint = LOT_PointInLine(currentPoint, subpath->endPoint, currentSpanEndT);
        }
        [self LOT_addLineToPoint:toPoint];
        currentPoint = toPoint;
      } else if (subpath->type == kCGPathElementAddCurveToPoint) {

        CGPoint cp1, cp2, end;
        cp1 = subpath->controlPoint1;
        cp2 = subpath->controlPoint2;
        end = subpath->endPoint;
        
        if (currentSpanStartT >= 0) {
          // The current drawable span either starts with this subpath or along this subpath.
          // If this is the middle of a segment then currentSpanStartT would be less than 0
          // Beginning of a segment Move start point and calculate cp1 and 2 is necessary
          if (currentSpanStartT > 0) {
            CGPoint A = LOT_PointInLine(currentPoint, cp1, currentSpanStartT);
            CGPoint B = LOT_PointInLine(cp1, cp2, currentSpanStartT);
            CGPoint C = LOT_PointInLine(cp2, end, currentSpanStartT);
            CGPoint D = LOT_PointInLine(A, B, currentSpanStartT);
            CGPoint E = LOT_PointInLine(B, C, currentSpanStartT);
            CGPoint F = LOT_PointInLine(D, E, currentSpanStartT);
            currentPoint = F;
            cp1 = E;
            cp2 = C;
            currentSpanEndT = LOT_RemapValue(currentSpanEndT, currentSpanStartT, 1, 0, 1);
          }
          [self LOT_moveToPoint:currentPoint];
        }
        
        if (currentSpanEndT < 1) {
          CGPoint A = LOT_PointInLine(currentPoint, cp1, currentSpanEndT);
          CGPoint B = LOT_PointInLine(cp1, cp2, currentSpanEndT);
          CGPoint C = LOT_PointInLine(cp2, end, currentSpanEndT);
          CGPoint D = LOT_PointInLine(A, B, currentSpanEndT);
          CGPoint E = LOT_PointInLine(B, C, currentSpanEndT);
          CGPoint F = LOT_PointInLine(D, E, currentSpanEndT);
          cp1 = A;
          cp2 = D;
          end = F;
        }
        [self LOT_addCurveToPoint:end controlPoint1:cp1 controlPoint2:cp2];
      }

      if (currentSpanEndT <= 1) {
        // We have possibly reached the end.
        // Current From and To will possibly need to be reset.
        if (fromLength < toLength) {
            while (subpath) {
                LOT_Subpath *nextNode = subpath->nextSubpath;
                subpath->nextSubpath = NULL;
                free(subpath);
                subpath = nextNode;
            }
            break;
        } else {
          currentStartLength = fromLength;
          currentEndLength = totalLength;
          if (fromLength < (subpathBeginningLength + pathLength) &&
              fromLength > subpathBeginningLength &&
              currentSpanEndT < 1) {
            // Loop over this subpath one more time.
            // In this case the path start and end trim fall within this subpath bounds
            continue;
          }
        }
      }
    }
    currentPoint = subpath->endPoint;
    subpathBeginningLength = subpathEndLength;
    
    LOT_Subpath *nextNode = subpath->nextSubpath;
    subpath->nextSubpath = NULL;
    free(subpath);
    subpath = nextNode;
  }
}

#pragma mark - From CGPath

- (void)setWithCGPath:(CGPathRef)path {
  [self lot_enumeratePath:path elementsUsingBlock:^(const CGPathElement *element) {
    switch (element->type) {
      case kCGPathElementMoveToPoint: {
        CGPoint point = element ->points[0];
        [self LOT_moveToPoint:point];
        break;
      }
      case kCGPathElementAddLineToPoint: {
        CGPoint point = element ->points[0];
        [self LOT_addLineToPoint:point];
        break;
      }
      case kCGPathElementAddQuadCurveToPoint: {
        break;
      }
      case kCGPathElementAddCurveToPoint: {
        CGPoint point1 = element->points[0];
        CGPoint point2 = element->points[1];
        CGPoint point3 = element->points[2];
        [self LOT_addCurveToPoint:point3 controlPoint1:point1 controlPoint2:point2];
        break;
      }
      case kCGPathElementCloseSubpath: {
        [self LOT_closePath];
        break;
      }
    }
  }];
}

- (void)lot_enumeratePath:(CGPathRef)cgPath elementsUsingBlock:(LOTBezierPathEnumerationHandler)handler {
  void CGPathEnumerationCallback(void *info, const CGPathElement *element);
  CGPathApply(cgPath, (__bridge void * _Nullable)(handler), CGPathEnumerationCallback);
}

@end

void CGPathEnumerationCallback(void *info, const CGPathElement *element)
{
  LOTBezierPathEnumerationHandler handler = (__bridge  LOTBezierPathEnumerationHandler)(info);
  if (handler) {
    handler(element);
  }
}
