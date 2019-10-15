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

#import "ZXQRCodeFinderPatternFinder.h"

@class ZXDecodeHints;

/**
 * This class attempts to find finder patterns in a QR Code. Finder patterns are the square
 * markers at three corners of a QR Code.
 *
 * This class is thread-safe but not reentrant. Each thread must allocate its own object.
 *
 * In contrast to ZXFinderPatternFinder, this class will return an array of all possible
 * QR code locations in the image.
 *
 * Use the tryHarder hint to ask for a more thorough detection.
 */
@interface ZXMultiFinderPatternFinder : ZXQRCodeFinderPatternFinder

- (NSArray *)findMulti:(ZXDecodeHints *)hints error:(NSError **)error;

@end
