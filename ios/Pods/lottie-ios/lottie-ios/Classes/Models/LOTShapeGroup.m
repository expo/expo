//
//  LOTShape.m
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/14/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import "LOTShapeGroup.h"
#import "LOTShapeFill.h"
#import "LOTShapePath.h"
#import "LOTShapeCircle.h"
#import "LOTShapeStroke.h"
#import "LOTShapeTransform.h"
#import "LOTShapeRectangle.h"
#import "LOTShapeTrimPath.h"
#import "LOTShapeGradientFill.h"
#import "LOTShapeStar.h"
#import "LOTShapeRepeater.h"

@implementation LOTShapeGroup

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
  
  NSArray *itemsJSON = jsonDictionary[@"it"];
  NSMutableArray *items = [NSMutableArray array];
  for (NSDictionary *itemJSON in itemsJSON) {
    id newItem = [LOTShapeGroup shapeItemWithJSON:itemJSON];
    if (newItem) {
      [items addObject:newItem];
    }
  }
  _items = items;
}

+ (id)shapeItemWithJSON:(NSDictionary *)itemJSON {
  NSString *type = itemJSON[@"ty"];
  if ([type isEqualToString:@"gr"]) {
    LOTShapeGroup *group = [[LOTShapeGroup alloc] initWithJSON:itemJSON];
    return group;
  } else if ([type isEqualToString:@"st"]) {
    LOTShapeStroke *stroke = [[LOTShapeStroke alloc] initWithJSON:itemJSON];
    return stroke;
  } else if ([type isEqualToString:@"fl"]) {
    LOTShapeFill *fill = [[LOTShapeFill alloc] initWithJSON:itemJSON];
    return fill;
  } else if ([type isEqualToString:@"tr"]) {
    LOTShapeTransform *transform = [[LOTShapeTransform alloc] initWithJSON:itemJSON];
    return transform;
  } else if ([type isEqualToString:@"sh"]) {
    LOTShapePath *path = [[LOTShapePath alloc] initWithJSON:itemJSON];
    return path;
  } else if ([type isEqualToString:@"el"]) {
    LOTShapeCircle *circle = [[LOTShapeCircle alloc] initWithJSON:itemJSON];
    return circle;
  } else if ([type isEqualToString:@"rc"]) {
    LOTShapeRectangle *rectangle = [[LOTShapeRectangle alloc] initWithJSON:itemJSON];
    return rectangle;
  } else if ([type isEqualToString:@"tm"]) {
    LOTShapeTrimPath *trim = [[LOTShapeTrimPath alloc] initWithJSON:itemJSON];
    return trim;
  } else  if ([type isEqualToString:@"gs"]) {
    NSLog(@"%s: Warning: gradient strokes are not supported", __PRETTY_FUNCTION__);
  } else  if ([type isEqualToString:@"gf"]) {
    LOTShapeGradientFill *gradientFill = [[LOTShapeGradientFill alloc] initWithJSON:itemJSON];
    return gradientFill;
  } else if ([type isEqualToString:@"sr"]) {
    LOTShapeStar *star = [[LOTShapeStar alloc] initWithJSON:itemJSON];
    return star;
  } else if ([type isEqualToString:@"mm"]) {
    NSString *name = itemJSON[@"nm"];
    NSLog(@"%s: Warning: merge shape is not supported. name: %@", __PRETTY_FUNCTION__, name);
  } else if ([type isEqualToString:@"rp"]) {
    LOTShapeRepeater *repeater = [[LOTShapeRepeater alloc] initWithJSON:itemJSON];
    return repeater;
  } else {
    NSString *name = itemJSON[@"nm"];
    NSLog(@"%s: Unsupported shape: %@ name: %@", __PRETTY_FUNCTION__, type, name);
  }
  
  return nil;
}

- (NSString *)description {
    NSMutableString *text = [[super description] mutableCopy];
    [text appendFormat:@" items: %@", self.items];
    return text;
}

@end
