//
//  LOTKeyframe.m
//  Pods
//
//  Created by brandon_withrow on 7/10/17.
//
//

#import "LOTKeyframe.h"
#import "CGGeometry+LOTAdditions.h"

@implementation LOTKeyframe

- (instancetype)initWithKeyframe:(NSDictionary *)keyframe {
  self = [super init];
  if (self) {
    _keyframeTime = keyframe[@"t"];
    _inTangent = CGPointZero;
    _outTangent = CGPointZero;
    _spatialInTangent = CGPointZero;
    _spatialOutTangent = CGPointZero;
    NSDictionary *timingOutTangent = keyframe[@"o"];
    NSDictionary *timingInTangent = keyframe[@"i"];
    if (timingInTangent) {
      _inTangent = [self _pointFromValueDict:timingInTangent];
    }
    if (timingOutTangent) {
      _outTangent = [self _pointFromValueDict:timingOutTangent];
    }
    if ([keyframe[@"h"] boolValue]) {
      _isHold = YES;
    }
    if (keyframe[@"to"]) {
      NSArray *to = keyframe[@"to"];
      _spatialOutTangent = [self _pointFromValueArray:to];
    }
    if (keyframe[@"ti"]) {
      NSArray *ti = keyframe[@"ti"];
      _spatialInTangent =  [self _pointFromValueArray:ti];
    }
    id data = keyframe[@"s"];
    if (data) {
      [self setupOutputWithData:data];
    }
  }
  return self;
}

- (instancetype)initWithValue:(id)value {
  self = [super init];
  if (self) {
    _keyframeTime = @0;
    _isHold = YES;
    [self setupOutputWithData:value];
  }
  return self;
}

- (instancetype)initWithLOTKeyframe:(LOTKeyframe *)keyframe {
  self = [super init];
  if (self) {
    _keyframeTime = [keyframe.keyframeTime copy];
    _inTangent = keyframe.inTangent;
    _outTangent = keyframe.outTangent;
    _spatialInTangent = keyframe.spatialInTangent;
    _spatialOutTangent = keyframe.spatialOutTangent;
    _isHold = keyframe.isHold;
  }
  return self;
}

- (LOTKeyframe *)copyWithData:(id)data {
  LOTKeyframe *newFrame = [[LOTKeyframe alloc] initWithLOTKeyframe:self];
  [newFrame setData:data];
  return newFrame;
}

- (void)setData:(id)data {
  [self setupOutputWithData:data];
}

- (void)remapValueWithBlock:(CGFloat (^)(CGFloat inValue))remapBlock {
  _floatValue = remapBlock(_floatValue);
  _pointValue = CGPointMake(remapBlock(_pointValue.x), remapBlock(_pointValue.y));
  _sizeValue = CGSizeMake(remapBlock(_sizeValue.width), remapBlock(_sizeValue.height));
}

- (void)setupOutputWithData:(id)data {
  if ([data isKindOfClass:[NSNumber class]]) {
    _floatValue = [(NSNumber *)data floatValue];
  }
  if ([data isKindOfClass:[NSArray class]] &&
      [[(NSArray *)data firstObject] isKindOfClass:[NSNumber class]]) {
    NSArray *numberArray = (NSArray *)data;
    if (numberArray.count > 0) {
      _floatValue = [(NSNumber *)numberArray[0] floatValue];
    }
    if (numberArray.count > 1) {
      _pointValue = CGPointMake(_floatValue = [(NSNumber *)numberArray[0] floatValue],
                                _floatValue = [(NSNumber *)numberArray[1] floatValue]);
      _sizeValue = CGSizeMake(_pointValue.x, _pointValue.y);
    }
    if (numberArray.count > 3) {
      _colorValue = [self _colorValueFromArray:numberArray];
    }
    _arrayValue = numberArray;
  } else if ([data isKindOfClass:[NSArray class]] &&
      [[(NSArray *)data firstObject] isKindOfClass:[NSDictionary class]]) {
    _pathData = [[LOTBezierData alloc] initWithData:[(NSArray *)data firstObject]];
  } else if ([data isKindOfClass:[NSDictionary class]]) {
    _pathData = [[LOTBezierData alloc] initWithData:data];
  }
}

- (CGPoint)_pointFromValueArray:(NSArray *)values {
  CGPoint returnPoint = CGPointZero;
  if (values.count > 1) {
    returnPoint.x = [(NSNumber *)values[0] floatValue];
    returnPoint.y = [(NSNumber *)values[1] floatValue];
  }
  return returnPoint;
}

- (CGPoint)_pointFromValueDict:(NSDictionary *)values {
  NSNumber *xValue = @0, *yValue = @0;
  if ([values[@"x"] isKindOfClass:[NSNumber class]]) {
    xValue = values[@"x"];
  } else if ([values[@"x"] isKindOfClass:[NSArray class]]) {
    xValue = values[@"x"][0];
  }
  
  if ([values[@"y"] isKindOfClass:[NSNumber class]]) {
    yValue = values[@"y"];
  } else if ([values[@"y"] isKindOfClass:[NSArray class]]) {
    yValue = values[@"y"][0];
  }
  
  return CGPointMake([xValue floatValue], [yValue floatValue]);
}

- (UIColor *)_colorValueFromArray:(NSArray<NSNumber *>  *)colorArray {
  if (colorArray.count == 4) {
    BOOL shouldUse255 = NO;
    for (NSNumber *number in colorArray) {
      if (number.floatValue > 1) {
        shouldUse255 = YES;
      }
    }
    return [UIColor colorWithRed:colorArray[0].floatValue / (shouldUse255 ? 255.f : 1.f)
                           green:colorArray[1].floatValue / (shouldUse255 ? 255.f : 1.f)
                            blue:colorArray[2].floatValue / (shouldUse255 ? 255.f : 1.f)
                           alpha:colorArray[3].floatValue / (shouldUse255 ? 255.f : 1.f)];
  }
  return nil;
}

@end

@implementation LOTKeyframeGroup

- (instancetype)initWithData:(id)data {
  self = [super init];
  if (self) {
    if ([data isKindOfClass:[NSDictionary class]] &&
        [(NSDictionary *)data valueForKey:@"k"]) {
      [self buildKeyframesFromData:[(NSDictionary *)data valueForKey:@"k"]];
    } else {
      [self buildKeyframesFromData:data];
    }
  }
  return self;
}

- (void)buildKeyframesFromData:(id)data {
  if ([data isKindOfClass:[NSArray class]] &&
      [[(NSArray *)data firstObject] isKindOfClass:[NSDictionary class]] &&
      [(NSArray *)data firstObject][@"t"]) {
    // Array of Keyframes
    NSArray *keyframes =  (NSArray *)data;
    NSMutableArray *keys = [NSMutableArray array];
    NSDictionary *previousFrame = nil;
    for (NSDictionary *keyframe in keyframes) {
      NSMutableDictionary *currentFrame = [NSMutableDictionary dictionary];
      if (keyframe[@"t"]) {
        // Set time
        currentFrame[@"t"] = keyframe[@"t"];
      }
      if (keyframe[@"s"]) {
        // Set Value for Keyframe
        currentFrame[@"s"] = keyframe[@"s"];
      } else if (previousFrame[@"e"]) {
        // Set Value for Keyframe
        currentFrame[@"s"] = previousFrame[@"e"];
      }
      if (keyframe[@"o"]) {
        // Set out tangent
        currentFrame[@"o"] = keyframe[@"o"];
      }
      if (previousFrame[@"i"]) {
        currentFrame[@"i"] = previousFrame[@"i"];
      }
      if (keyframe[@"to"]) {
        // Set out tangent
        currentFrame[@"to"] = keyframe[@"to"];
      }
      if (previousFrame[@"ti"]) {
        currentFrame[@"ti"] = previousFrame[@"ti"];
      }
      if (keyframe[@"h"]) {
        currentFrame[@"h"] = keyframe[@"h"];
      }
      LOTKeyframe *key = [[LOTKeyframe alloc] initWithKeyframe:currentFrame];
      [keys addObject:key];
      previousFrame = keyframe;
    }
    _keyframes = keys;
    
  } else {
    LOTKeyframe *key = [[LOTKeyframe alloc] initWithValue:data];
    _keyframes = @[key];
  }
}

- (void)remapKeyframesWithBlock:(CGFloat (^)(CGFloat))remapBlock {
  for (LOTKeyframe *keyframe in _keyframes) {
    [keyframe remapValueWithBlock:remapBlock];
  }
}

@end
/*
 +KeyFrameObject has
 +	i (PointObject)			// Timing curve in tangent
 +	o (PointObject)			// Timing curve out tangent
 +	n (array of string)		// String representation of timing curve
 +	t (integer)				// Keyframe time for start of keyframe
 +	s (float or array of float or PathObject)	// The key information
 +	e (float or array of float or PathObject)	// The end key information
 +	to (array of float)		// For spacial bezier path interpolation, the in tangent
 +	ti (array of float)		// For spacial bezier path interpolation, the out tangent
 +	h (integer)				// If the keyframe is a Hold keyframe or not
*/
