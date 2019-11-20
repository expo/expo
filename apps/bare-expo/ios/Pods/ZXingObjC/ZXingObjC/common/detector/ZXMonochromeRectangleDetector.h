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

@class ZXBitMatrix;

/**
 * A somewhat generic detector that looks for a barcode-like rectangular region within an image.
 * It looks within a mostly white region of an image for a region of black and white, but mostly
 * black. It returns the four corners of the region, as best it can determine.
 */
@interface ZXMonochromeRectangleDetector : NSObject

- (id)initWithImage:(ZXBitMatrix *)image;

/**
 * Detects a rectangular region of black and white -- mostly black -- with a region of mostly
 * white, in an image.
 *
 * @return ZXResultPoint array describing the corners of the rectangular region. The first and
 *  last points are opposed on the diagonal, as are the second and third. The first point will be
 *  the topmost point and the last, the bottommost. The second point will be leftmost and the
 *  third, the rightmost
 * @return nil if no Data Matrix Code can be found
 */
- (NSArray *)detectWithError:(NSError **)error;

@end
