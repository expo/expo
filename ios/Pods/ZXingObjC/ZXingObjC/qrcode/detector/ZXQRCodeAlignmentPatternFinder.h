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

@protocol ZXResultPointCallback;
@class ZXBitMatrix, ZXQRCodeAlignmentPattern;

/**
 * This class attempts to find alignment patterns in a QR Code. Alignment patterns look like finder
 * patterns but are smaller and appear at regular intervals throughout the image.
 *
 * At the moment this only looks for the bottom-right alignment pattern.
 *
 * This is mostly a simplified copy of ZXFinderPatternFinder. It is copied,
 * pasted and stripped down here for maximum performance but does unfortunately duplicate
 * some code.
 *
 * This class is thread-safe but not reentrant. Each thread must allocate its own object.
 */
@interface ZXQRCodeAlignmentPatternFinder : NSObject

/**
 * Creates a finder that will look in a portion of the whole image.
 *
 * @param image image to search
 * @param startX left column from which to start searching
 * @param startY top row from which to start searching
 * @param width width of region to search
 * @param height height of region to search
 * @param moduleSize estimated module size so far
 */

- (id)initWithImage:(ZXBitMatrix *)image startX:(int)startX startY:(int)startY width:(int)width height:(int)height moduleSize:(float)moduleSize resultPointCallback:(id<ZXResultPointCallback>)resultPointCallback;

/**
 * This method attempts to find the bottom-right alignment pattern in the image. It is a bit messy since
 * it's pretty performance-critical and so is written to be fast foremost.
 *
 * @return ZXAlignmentPattern if found or nil if not found
 */
- (ZXQRCodeAlignmentPattern *)findWithError:(NSError **)error;

@end
