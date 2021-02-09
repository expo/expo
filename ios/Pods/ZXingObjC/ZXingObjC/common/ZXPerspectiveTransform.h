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

/**
 * This class implements a perspective transform in two dimensions. Given four source and four
 * destination points, it will compute the transformation implied between them. The code is based
 * directly upon section 3.4.2 of George Wolberg's "Digital Image Warping"; see pages 54-56.
 */
@interface ZXPerspectiveTransform : NSObject

+ (ZXPerspectiveTransform *)quadrilateralToQuadrilateral:(float)x0 y0:(float)y0 x1:(float)x1 y1:(float)y1 x2:(float)x2 y2:(float)y2 x3:(float)x3 y3:(float)y3 x0p:(float)x0p y0p:(float)y0p x1p:(float)x1p y1p:(float)y1p x2p:(float)x2p y2p:(float)y2p x3p:(float)x3p y3p:(float)y3p;
- (void)transformPoints:(float *)points pointsLen:(int)pointsLen;
- (void)transformPoints:(float *)xValues yValues:(float *)yValues pointsLen:(int)pointsLen;
+ (ZXPerspectiveTransform *)squareToQuadrilateral:(float)x0 y0:(float)y0 x1:(float)x1 y1:(float)y1 x2:(float)x2 y2:(float)y2 x3:(float)x3 y3:(float)y3;
+ (ZXPerspectiveTransform *)quadrilateralToSquare:(float)x0 y0:(float)y0 x1:(float)x1 y1:(float)y1 x2:(float)x2 y2:(float)y2 x3:(float)x3 y3:(float)y3;
- (ZXPerspectiveTransform *)buildAdjoint;
- (ZXPerspectiveTransform *)times:(ZXPerspectiveTransform *)other;

@end
