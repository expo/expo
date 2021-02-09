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
 * Encapsulates a point of interest in an image containing a barcode. Typically, this
 * would be the location of a finder pattern or the corner of the barcode, for example.
 */
@interface ZXResultPoint : NSObject<NSCopying>

@property (nonatomic, assign, readonly) float x;
@property (nonatomic, assign, readonly) float y;

- (id)initWithX:(float)x y:(float)y;

+ (id)resultPointWithX:(float)x y:(float)y;

/**
 * Orders an array of three ResultPoints in an order [A,B,C] such that AB is less than AC
 * and BC is less than AC, and the angle between BC and BA is less than 180 degrees.
 *
 * @param patterns array of three ZXResultPoints to order
 */
+ (void)orderBestPatterns:(NSMutableArray *)patterns;

/**
 * @param pattern1 first pattern
 * @param pattern2 second pattern
 * @return distance between two points
 */
+ (float)distance:(ZXResultPoint *)pattern1 pattern2:(ZXResultPoint *)pattern2;

@end
