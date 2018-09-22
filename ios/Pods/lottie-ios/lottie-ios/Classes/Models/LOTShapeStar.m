//
//  LOTShapeStar.m
//  Lottie
//
//  Created by brandon_withrow on 7/27/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTShapeStar.h"

@implementation LOTShapeStar

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary {
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
  
  NSDictionary *outerRadius = jsonDictionary[@"or"];
  if (outerRadius) {
    _outerRadius = [[LOTKeyframeGroup alloc] initWithData:outerRadius];
  }
  
  NSDictionary *outerRoundness = jsonDictionary[@"os"];
  if (outerRoundness) {
    _outerRoundness = [[LOTKeyframeGroup alloc] initWithData:outerRoundness];
  }
  
  NSDictionary *innerRadius = jsonDictionary[@"ir"];
  if (innerRadius) {
    _innerRadius = [[LOTKeyframeGroup alloc] initWithData:innerRadius];
  }
  
  NSDictionary *innerRoundness = jsonDictionary[@"is"];
  if (innerRoundness) {
    _innerRoundness = [[LOTKeyframeGroup alloc] initWithData:innerRoundness];
  }
  
  NSDictionary *position = jsonDictionary[@"p"];
  if (position) {
    _position = [[LOTKeyframeGroup alloc] initWithData:position];
  }
  
  NSDictionary *numberOfPoints = jsonDictionary[@"pt"];
  if (numberOfPoints) {
    _numberOfPoints = [[LOTKeyframeGroup alloc] initWithData:numberOfPoints];
  }
  
  NSDictionary *rotation = jsonDictionary[@"r"];
  if (rotation) {
    _rotation = [[LOTKeyframeGroup alloc] initWithData:rotation];
  }
  
  NSNumber *type = jsonDictionary[@"sy"];
  _type = type.integerValue;
}

@end
