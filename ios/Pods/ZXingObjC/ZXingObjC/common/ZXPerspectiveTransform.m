/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "ZXPerspectiveTransform.h"

@interface ZXPerspectiveTransform ()

@property (nonatomic, assign, readonly) float a11;
@property (nonatomic, assign, readonly) float a12;
@property (nonatomic, assign, readonly) float a13;
@property (nonatomic, assign, readonly) float a21;
@property (nonatomic, assign, readonly) float a22;
@property (nonatomic, assign, readonly) float a23;
@property (nonatomic, assign, readonly) float a31;
@property (nonatomic, assign, readonly) float a32;
@property (nonatomic, assign, readonly) float a33;

@end

@implementation ZXPerspectiveTransform

- (id)initWithA11:(float)a11 a21:(float)a21 a31:(float)a31 a12:(float)a12 a22:(float)a22 a32:(float)a32 a13:(float)a13 a23:(float)a23 a33:(float)a33 {
  if (self = [super init]) {
    _a11 = a11;
    _a12 = a12;
    _a13 = a13;
    _a21 = a21;
    _a22 = a22;
    _a23 = a23;
    _a31 = a31;
    _a32 = a32;
    _a33 = a33;
  }

  return self;
}

+ (ZXPerspectiveTransform *)quadrilateralToQuadrilateral:(float)x0 y0:(float)y0 x1:(float)x1 y1:(float)y1 x2:(float)x2 y2:(float)y2 x3:(float)x3 y3:(float)y3 x0p:(float)x0p y0p:(float)y0p x1p:(float)x1p y1p:(float)y1p x2p:(float)x2p y2p:(float)y2p x3p:(float)x3p y3p:(float)y3p {
  ZXPerspectiveTransform *qToS = [self quadrilateralToSquare:x0 y0:y0 x1:x1 y1:y1 x2:x2 y2:y2 x3:x3 y3:y3];
  ZXPerspectiveTransform *sToQ = [self squareToQuadrilateral:x0p y0:y0p x1:x1p y1:y1p x2:x2p y2:y2p x3:x3p y3:y3p];
  return [sToQ times:qToS];
}

- (void)transformPoints:(float *)points pointsLen:(int)pointsLen {
  int max = pointsLen;
  for (int i = 0; i < max; i += 2) {
    float x = points[i];
    float y = points[i + 1];
    float denominator = self.a13 * x + self.a23 * y + self.a33;
    points[i] = (self.a11 * x + self.a21 * y + self.a31) / denominator;
    points[i + 1] = (self.a12 * x + self.a22 * y + self.a32) / denominator;
  }
}

- (void)transformPoints:(float *)xValues yValues:(float *)yValues pointsLen:(int)pointsLen {
  int n = pointsLen;
  for (int i = 0; i < n; i ++) {
    float x = xValues[i];
    float y = yValues[i];
    float denominator = self.a13 * x + self.a23 * y + self.a33;
    xValues[i] = (self.a11 * x + self.a21 * y + self.a31) / denominator;
    yValues[i] = (self.a12 * x + self.a22 * y + self.a32) / denominator;
  }
}

+ (ZXPerspectiveTransform *)squareToQuadrilateral:(float)x0 y0:(float)y0 x1:(float)x1 y1:(float)y1 x2:(float)x2 y2:(float)y2 x3:(float)x3 y3:(float)y3 {
  float dx3 = x0 - x1 + x2 - x3;
  float dy3 = y0 - y1 + y2 - y3;
  if (dx3 == 0.0f && dy3 == 0.0f) {
    // Affine
    return [[ZXPerspectiveTransform alloc] initWithA11:x1 - x0 a21:x2 - x1 a31:x0 a12:y1 - y0 a22:y2 - y1 a32:y0 a13:0.0f a23:0.0f a33:1.0f];
  } else {
    float dx1 = x1 - x2;
    float dx2 = x3 - x2;
    float dy1 = y1 - y2;
    float dy2 = y3 - y2;
    float denominator = dx1 * dy2 - dx2 * dy1;
    float a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
    float a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
    return [[ZXPerspectiveTransform alloc] initWithA11:x1 - x0 + a13 * x1 a21:x3 - x0 + a23 * x3 a31:x0 a12:y1 - y0 + a13 * y1 a22:y3 - y0 + a23 * y3 a32:y0 a13:a13 a23:a23 a33:1.0f];
  }
}

+ (ZXPerspectiveTransform *)quadrilateralToSquare:(float)x0 y0:(float)y0 x1:(float)x1 y1:(float)y1 x2:(float)x2 y2:(float)y2 x3:(float)x3 y3:(float)y3 {
  return [[self squareToQuadrilateral:x0 y0:y0 x1:x1 y1:y1 x2:x2 y2:y2 x3:x3 y3:y3] buildAdjoint];
}

- (ZXPerspectiveTransform *)buildAdjoint {
  return [[ZXPerspectiveTransform alloc] initWithA11:self.a22 * self.a33 - self.a23 * self.a32
                                                 a21:self.a23 * self.a31 - self.a21 * self.a33
                                                 a31:self.a21 * self.a32 - self.a22 * self.a31
                                                 a12:self.a13 * self.a32 - self.a12 * self.a33
                                                 a22:self.a11 * self.a33 - self.a13 * self.a31
                                                 a32:self.a12 * self.a31 - self.a11 * self.a32
                                                 a13:self.a12 * self.a23 - self.a13 * self.a22
                                                 a23:self.a13 * self.a21 - self.a11 * self.a23
                                                 a33:self.a11 * self.a22 - self.a12 * self.a21];
}

- (ZXPerspectiveTransform *)times:(ZXPerspectiveTransform *)other {
  return [[ZXPerspectiveTransform alloc] initWithA11:self.a11 * other.a11 + self.a21 * other.a12 + self.a31 * other.a13
                                                 a21:self.a11 * other.a21 + self.a21 * other.a22 + self.a31 * other.a23
                                                 a31:self.a11 * other.a31 + self.a21 * other.a32 + self.a31 * other.a33
                                                 a12:self.a12 * other.a11 + self.a22 * other.a12 + self.a32 * other.a13
                                                 a22:self.a12 * other.a21 + self.a22 * other.a22 + self.a32 * other.a23
                                                 a32:self.a12 * other.a31 + self.a22 * other.a32 + self.a32 * other.a33
                                                 a13:self.a13 * other.a11 + self.a23 * other.a12 + self.a33 * other.a13
                                                 a23:self.a13 * other.a21 + self.a23 * other.a22 + self.a33 * other.a23
                                                 a33:self.a13 * other.a31 + self.a23 * other.a32 + self.a33 * other.a33];
}

@end
