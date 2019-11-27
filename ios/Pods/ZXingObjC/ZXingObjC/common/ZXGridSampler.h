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

@class ZXBitMatrix, ZXPerspectiveTransform;

/**
 * Implementations of this class can, given locations of finder patterns for a QR code in an
 * image, sample the right points in the image to reconstruct the QR code, accounting for
 * perspective distortion. It is abstracted since it is relatively expensive and should be allowed
 * to take advantage of platform-specific optimized implementations, like Sun's Java Advanced
 * Imaging library, but which may not be available in other environments such as J2ME, and vice
 * versa.
 *
 * The implementation used can be controlled by calling `setGridSampler:`
 * with an instance of a class which implements this interface.
 */
@interface ZXGridSampler : NSObject

/**
 * Sets the implementation of GridSampler used by the library. One global
 * instance is stored, which may sound problematic. But, the implementation provided
 * ought to be appropriate for the entire platform, and all uses of this library
 * in the whole lifetime of the JVM. For instance, an Android activity can swap in
 * an implementation that takes advantage of native platform libraries.
 *
 * @param newGridSampler The platform-specific object to install.
 */
+ (void)setGridSampler:(ZXGridSampler *)newGridSampler;

/**
 * @return the current implementation of GridSampler
 */
+ (ZXGridSampler *)instance;

/**
 * Samples an image for a rectangular matrix of bits of the given dimension. The sampling
 * transformation is determined by the coordinates of 4 points, in the original and transformed
 * image space.
 *
 * @param image image to sample
 * @param dimensionX width of ZXBitMatrix to sample from image
 * @param dimensionY height of ZXBitMatrix to sample from image
 * @param p1ToX point 1 preimage X
 * @param p1ToY point 1 preimage Y
 * @param p2ToX point 2 preimage X
 * @param p2ToY point 2 preimage Y
 * @param p3ToX point 3 preimage X
 * @param p3ToY point 3 preimage Y
 * @param p4ToX point 4 preimage X
 * @param p4ToY point 4 preimage Y
 * @param p1FromX point 1 image X
 * @param p1FromY point 1 image Y
 * @param p2FromX point 2 image X
 * @param p2FromY point 2 image Y
 * @param p3FromX point 3 image X
 * @param p3FromY point 3 image Y
 * @param p4FromX point 4 image X
 * @param p4FromY point 4 image Y
 * @return ZXBitMatrix representing a grid of points sampled from the image within a region
 *   defined by the "from" parameters or nil if image can't be sampled, for example, if the transformation defined
 *   by the given points is invalid or results in sampling outside the image boundaries
 */
- (ZXBitMatrix *)sampleGrid:(ZXBitMatrix *)image
                 dimensionX:(int)dimensionX
                 dimensionY:(int)dimensionY
                      p1ToX:(float)p1ToX p1ToY:(float)p1ToY
                      p2ToX:(float)p2ToX p2ToY:(float)p2ToY
                      p3ToX:(float)p3ToX p3ToY:(float)p3ToY
                      p4ToX:(float)p4ToX p4ToY:(float)p4ToY
                    p1FromX:(float)p1FromX p1FromY:(float)p1FromY
                    p2FromX:(float)p2FromX p2FromY:(float)p2FromY
                    p3FromX:(float)p3FromX p3FromY:(float)p3FromY
                    p4FromX:(float)p4FromX p4FromY:(float)p4FromY
                      error:(NSError **)error;

- (ZXBitMatrix *)sampleGrid:(ZXBitMatrix *)image
                 dimensionX:(int)dimensionX
                 dimensionY:(int)dimensionY
                  transform:(ZXPerspectiveTransform *)transform
                      error:(NSError **)error;

/**
 * <p>Checks a set of points that have been transformed to sample points on an image against
 * the image's dimensions to see if the point are even within the image.</p>
 *
 * <p>This method will actually "nudge" the endpoints back onto the image if they are found to be
 * barely (less than 1 pixel) off the image. This accounts for imperfect detection of finder
 * patterns in an image where the QR Code runs all the way to the image border.</p>
 *
 * <p>For efficiency, the method will check points from either end of the line until one is found
 * to be within the image. Because the set of points are assumed to be linear, this is valid.</p>
 *
 * @param image image into which the points should map
 * @param points actual points in x1,y1,...,xn,yn form
 * @returns NO if an endpoint is lies outside the image boundaries
 */
+ (BOOL)checkAndNudgePoints:(ZXBitMatrix *)image points:(float *)points pointsLen:(int)pointsLen error:(NSError **)error;

@end
