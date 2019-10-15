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

extern const int ZX_FINDER_PATTERN_MIN_SKIP;
extern const int ZX_FINDER_PATTERN_MAX_MODULES;

@protocol ZXResultPointCallback;
@class ZXBitMatrix, ZXDecodeHints, ZXQRCodeFinderPatternInfo;

/**
 * This class attempts to find finder patterns in a QR Code. Finder patterns are the square
 * markers at three corners of a QR Code.
 *
 * This class is thread-safe but not reentrant. Each thread must allocate its own object.
 */
@interface ZXQRCodeFinderPatternFinder : NSObject

@property (nonatomic, strong, readonly) ZXBitMatrix *image;
@property (nonatomic, strong, readonly) NSMutableArray *possibleCenters;

/**
 * Creates a finder that will search the image for three finder patterns.
 *
 * @param image image to search
 */
- (id)initWithImage:(ZXBitMatrix *)image;

- (id)initWithImage:(ZXBitMatrix *)image resultPointCallback:(id<ZXResultPointCallback>)resultPointCallback;

- (ZXQRCodeFinderPatternInfo *)find:(ZXDecodeHints *)hints error:(NSError **)error;

/**
 * @param stateCount count of black/white/black/white/black pixels just read
 * @return true iff the proportions of the counts is close enough to the 1/1/3/1/1 ratios
 *         used by finder patterns to be considered a match
 */
+ (BOOL)foundPatternCross:(const int[])stateCount;

/**
 * This is called when a horizontal scan finds a possible alignment pattern. It will
 * cross check with a vertical scan, and if successful, will, ah, cross-cross-check
 * with another horizontal scan. This is needed primarily to locate the real horizontal
 * center of the pattern in cases of extreme skew.
 * And then we cross-cross-cross check with another diagonal scan.
 *
 * If that succeeds the finder pattern location is added to a list that tracks
 * the number of times each location has been nearly-matched as a finder pattern.
 * Each additional find is more evidence that the location is in fact a finder
 * pattern center
 *
 * @param stateCount reading state module counts from horizontal scan
 * @param i row where finder pattern may be found
 * @param j end of possible finder pattern in row
 * @return true if a finder pattern candidate was found this time
 */
- (BOOL)handlePossibleCenter:(const int[])stateCount i:(int)i j:(int)j;

@end
