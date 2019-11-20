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

#import "ZXBarcodeFormat.h"

@protocol ZXResultPointCallback;
@class ZXIntArray;

/**
 * Encapsulates hints that a caller may pass to a barcode reader to help it
 * more quickly or accurately decode it. It is up to implementations to decide what,
 * if anything, to do with the information that is supplied.
 */
@interface ZXDecodeHints : NSObject <NSCopying>

+ (id)hints;

/**
 * Assume Code 39 codes employ a check digit.
 */
@property (nonatomic, assign) BOOL assumeCode39CheckDigit;

/**
 * Assume the barcode is being processed as a GS1 barcode, and modify behavior as needed.
 * For example this affects FNC1 handling for Code 128 (aka GS1-128).
 */
@property (nonatomic, assign) BOOL assumeGS1;

/**
 * Allowed lengths of encoded data -- reject anything else.
 */
@property (nonatomic, strong) NSArray *allowedLengths;

/**
 * Specifies what character encoding to use when decoding, where applicable (type String)
 */
@property (nonatomic, assign) NSStringEncoding encoding;

/**
 * Unspecified, application-specific hint.
 */
@property (nonatomic, strong) id other;

/**
 * Image is a pure monochrome image of a barcode.
 */
@property (nonatomic, assign) BOOL pureBarcode;

/**
 * If true, return the start and end digits in a Codabar barcode instead of stripping them. They
 * are alpha, whereas the rest are numeric. By default, they are stripped, but this causes them
 * to not be.
 */
@property (nonatomic, assign) BOOL returnCodaBarStartEnd;

/**
 * The caller needs to be notified via callback when a possible ZXResultPoint
 * is found.
 */
@property (nonatomic, strong) id <ZXResultPointCallback> resultPointCallback;

/**
 * Spend more time to try to find a barcode; optimize for accuracy, not speed.
 */
@property (nonatomic, assign) BOOL tryHarder;

/**
 * Allowed extension lengths for EAN or UPC barcodes. Other formats will ignore this.
 * Maps to an ZXIntArray of the allowed extension lengths, for example [2], [5], or [2, 5].
 * If it is optional to have an extension, do not set this hint. If this is set,
 * and a UPC or EAN barcode is found but an extension is not, then no result will be returned
 * at all.
 */
@property (nonatomic, strong) ZXIntArray *allowedEANExtensions;

/**
 * Image is known to be of one of a few possible formats.
 */

@property (nonatomic, strong) NSDictionary *substitutions;

- (void)addPossibleFormat:(ZXBarcodeFormat)format;
- (BOOL)containsFormat:(ZXBarcodeFormat)format;
- (int)numberOfPossibleFormats;
- (void)removePossibleFormat:(ZXBarcodeFormat)format;

@end
