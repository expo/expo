//
//  LOTShapeRepeater.m
//  Lottie
//
//  Created by brandon_withrow on 7/28/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTShapeRepeater.h"
#import "CGGeometry+LOTAdditions.h"

@implementation LOTShapeRepeater

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary  {
  self = [super init];
  if (self) {
    [self _mapFromJSON:jsonDictionary];
  }
  return self;
}

- (void)_mapFromJSON:(NSDictionary *)jsonDictionary {
  
  if (jsonDictionary[@"nm"] ) {
    _keyname = [jsonDictionary[@"nm"] copy];
  }
  
  NSDictionary *copies = jsonDictionary[@"c"];
  if (copies) {
    _copies = [[LOTKeyframeGroup alloc] initWithData:copies];
  }
  
  NSDictionary *offset = jsonDictionary[@"o"];
  if (offset) {
    _offset = [[LOTKeyframeGroup alloc] initWithData:offset];
  }
  
  NSDictionary *transform = jsonDictionary[@"tr"];
  
  NSDictionary *rotation = transform[@"r"];
  if (rotation) {
    _rotation = [[LOTKeyframeGroup alloc] initWithData:rotation];
    [_rotation remapKeyframesWithBlock:^CGFloat(CGFloat inValue) {
      return LOT_DegreesToRadians(inValue);
    }];
  }
  
  NSDictionary *startOpacity = transform[@"so"];
  if (startOpacity) {
    _startOpacity = [[LOTKeyframeGroup alloc] initWithData:startOpacity];
    [_startOpacity remapKeyframesWithBlock:^CGFloat(CGFloat inValue) {
      return LOT_RemapValue(inValue, 0, 100, 0, 1);
    }];
  }
  
  NSDictionary *endOpacity = transform[@"eo"];
  if (endOpacity) {
    _endOpacity = [[LOTKeyframeGroup alloc] initWithData:endOpacity];
    [_endOpacity remapKeyframesWithBlock:^CGFloat(CGFloat inValue) {
      return LOT_RemapValue(inValue, 0, 100, 0, 1);
    }];
  }
  
  NSDictionary *anchorPoint = transform[@"a"];
  if (anchorPoint) {
    _anchorPoint = [[LOTKeyframeGroup alloc] initWithData:anchorPoint];
  }
  
  NSDictionary *position = transform[@"p"];
  if (position) {
    _position = [[LOTKeyframeGroup alloc] initWithData:position];
  }
  
  NSDictionary *scale = transform[@"s"];
  if (scale) {
    _scale = [[LOTKeyframeGroup alloc] initWithData:scale];
    [_scale remapKeyframesWithBlock:^CGFloat(CGFloat inValue) {
      return LOT_RemapValue(inValue, -100, 100, -1, 1);
    }];
  }
}

@end
