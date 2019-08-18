//
//  LOTBezierData.m
//  Lottie
//
//  Created by brandon_withrow on 7/10/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTBezierData.h"
#import "CGGeometry+LOTAdditions.h"

@implementation LOTBezierData {
  CGPoint *_vertices;
  CGPoint *_inTangents;
  CGPoint *_outTangents;
}

- (instancetype)initWithData:(NSDictionary *)bezierData
{
  self = [super init];
  if (self) {
    [self initializeData:bezierData];
  }
  return self;
}

- (void)dealloc {
  free(_vertices);
  free(_inTangents);
  free(_outTangents);
}

- (CGPoint)vertexAtIndex:(NSInteger)index {
  NSAssert((index < _count &&
            index >= 0),
           @"Lottie: Index out of bounds");
  return _vertices[index];
}

- (CGPoint)inTangentAtIndex:(NSInteger)index {
  NSAssert((index < _count &&
            index >= 0),
           @"Lottie: Index out of bounds");
  return _inTangents[index];
}

- (CGPoint)outTangentAtIndex:(NSInteger)index {
  NSAssert((index < _count &&
            index >= 0),
           @"Lottie: Index out of bounds");
  return _outTangents[index];
}

- (void)initializeData:(NSDictionary *)bezierData {

  NSArray *pointsArray = bezierData[@"v"];
  NSArray *inTangents = bezierData[@"i"];
  NSArray *outTangents = bezierData[@"o"];
  
  if (pointsArray.count == 0) {
    NSLog(@"%s: Warning: shape has no vertices", __PRETTY_FUNCTION__);
    return ;
  }
  
  NSAssert((pointsArray.count == inTangents.count &&
            pointsArray.count == outTangents.count),
           @"Lottie: Incorrect number of points and tangents");
  _count = pointsArray.count;
  _vertices = (CGPoint *)malloc(sizeof(CGPoint) * pointsArray.count);
  _inTangents = (CGPoint *)malloc(sizeof(CGPoint) * pointsArray.count);
  _outTangents = (CGPoint *)malloc(sizeof(CGPoint) * pointsArray.count);
  if (bezierData[@"c"]) {
    _closed = [bezierData[@"c"] boolValue];
  }
  for (int i = 0; i < pointsArray.count; i ++) {
    CGPoint vertex = [self _vertexAtIndex:i inArray:pointsArray];
    CGPoint outTan = LOT_PointAddedToPoint(vertex, [self _vertexAtIndex:i inArray:outTangents]);
    CGPoint inTan = LOT_PointAddedToPoint(vertex, [self _vertexAtIndex:i inArray:inTangents]);
    // BW BUG Straight Lines - Test Later
    // Bake fix for lines here
    _vertices[i] = vertex;
    _inTangents[i] = inTan;
    _outTangents[i] = outTan;
  }
}

- (CGPoint)_vertexAtIndex:(NSInteger)idx inArray:(NSArray *)points {
  NSAssert((idx < points.count),
           @"Lottie: Vertex Point out of bounds");
  
  NSArray *pointArray = points[idx];
  
  NSAssert((pointArray.count >= 2 &&
            [pointArray.firstObject isKindOfClass:[NSNumber class]]),
           @"Lottie: Point Data Malformed");
  
  return CGPointMake([(NSNumber *)pointArray[0] floatValue], [(NSNumber *)pointArray[1] floatValue]);
}

@end
