//
//  LOTBlockCallback.m
//  Lottie
//
//  Created by brandon_withrow on 12/15/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTBlockCallback.h"

@implementation LOTColorBlockCallback

+ (instancetype)withBlock:(LOTColorValueCallbackBlock)block {
  LOTColorBlockCallback *colorCallback = [[self alloc] init];
  colorCallback.callback = block;
  return colorCallback;
}

- (CGColorRef)colorForFrame:(CGFloat)currentFrame startKeyframe:(CGFloat)startKeyframe endKeyframe:(CGFloat)endKeyframe interpolatedProgress:(CGFloat)interpolatedProgress startColor:(CGColorRef)startColor endColor:(CGColorRef)endColor currentColor:(CGColorRef)interpolatedColor {
  return self.callback(currentFrame, startKeyframe, endKeyframe, interpolatedProgress, startColor, endColor, interpolatedColor);
}

@end

@implementation LOTNumberBlockCallback

+ (instancetype)withBlock:(LOTNumberValueCallbackBlock)block {
  LOTNumberBlockCallback *numberCallback = [[self alloc] init];
  numberCallback.callback = block;
  return numberCallback;
}

- (CGFloat)floatValueForFrame:(CGFloat)currentFrame startKeyframe:(CGFloat)startKeyframe endKeyframe:(CGFloat)endKeyframe interpolatedProgress:(CGFloat)interpolatedProgress startValue:(CGFloat)startValue endValue:(CGFloat)endValue currentValue:(CGFloat)interpolatedValue {
  return self.callback(currentFrame, startKeyframe, endKeyframe, interpolatedProgress, startValue, endValue, interpolatedValue);
}

@end

@implementation LOTPointBlockCallback

+ (instancetype)withBlock:(LOTPointValueCallbackBlock)block {
  LOTPointBlockCallback *callback = [[self alloc] init];
  callback.callback = block;
  return callback;
}

- (CGPoint)pointForFrame:(CGFloat)currentFrame startKeyframe:(CGFloat)startKeyframe endKeyframe:(CGFloat)endKeyframe interpolatedProgress:(CGFloat)interpolatedProgress startPoint:(CGPoint)startPoint endPoint:(CGPoint)endPoint currentPoint:(CGPoint)interpolatedPoint {
  return self.callback(currentFrame, startKeyframe, endKeyframe, interpolatedProgress, startPoint, endPoint, interpolatedPoint);
}

@end

@implementation LOTSizeBlockCallback

+ (instancetype)withBlock:(LOTSizeValueCallbackBlock)block {
  LOTSizeBlockCallback *callback = [[self alloc] init];
  callback.callback = block;
  return callback;
}

- (CGSize)sizeForFrame:(CGFloat)currentFrame startKeyframe:(CGFloat)startKeyframe endKeyframe:(CGFloat)endKeyframe interpolatedProgress:(CGFloat)interpolatedProgress startSize:(CGSize)startSize endSize:(CGSize)endSize currentSize:(CGSize)interpolatedSize {
  return self.callback(currentFrame, startKeyframe, endKeyframe, interpolatedProgress, startSize, endSize, interpolatedSize);
}

@end

@implementation LOTPathBlockCallback

+ (instancetype)withBlock:(LOTPathValueCallbackBlock)block {
  LOTPathBlockCallback *callback = [[self alloc] init];
  callback.callback = block;
  return callback;
}

- (CGPathRef)pathForFrame:(CGFloat)currentFrame startKeyframe:(CGFloat)startKeyframe endKeyframe:(CGFloat)endKeyframe interpolatedProgress:(CGFloat)interpolatedProgress {
  return self.callback(currentFrame, startKeyframe, endKeyframe, interpolatedProgress);
}

@end

