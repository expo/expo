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
 * Enumeration for DataMatrix symbol shape hint. It can be used to force square or rectangular
 * symbols.
 */
typedef enum {
  ZXDataMatrixSymbolShapeHintForceNone,
  ZXDataMatrixSymbolShapeHintForceSquare,
  ZXDataMatrixSymbolShapeHintForceRectangle
} ZXDataMatrixSymbolShapeHint;

typedef enum {
  ZXPDF417CompactionAuto,
  ZXPDF417CompactionText,
  ZXPDF417CompactionByte,
  ZXPDF417CompactionNumeric
} ZXPDF417Compaction;

@class ZXDimension, ZXPDF417Dimensions, ZXQRCodeErrorCorrectionLevel;

/**
 * These are a set of hints that you may pass to Writers to specify their behavior.
 */
@interface ZXEncodeHints : NSObject

+ (id)hints;

/**
 * Specifies what character encoding to use where applicable.
 */
@property (nonatomic, assign) NSStringEncoding encoding;

/**
 * Specifies the matrix shape for Data Matrix.
 */
@property (nonatomic, assign) ZXDataMatrixSymbolShapeHint dataMatrixShape;

/**
 * Specifies a minimum barcode size. Only applicable to Data Matrix now.
 *
 * @deprecated use width/height params in
 * ZXDataMatrixWriter encode:format:width:height:error:
 */
@property (nonatomic, strong) ZXDimension *minSize DEPRECATED_ATTRIBUTE;

/**
 * Specifies a maximum barcode size. Only applicable to Data Matrix now.
 *
 * @deprecated without replacement
 */
@property (nonatomic, strong) ZXDimension *maxSize DEPRECATED_ATTRIBUTE;

/**
 * Specifies what degree of error correction to use, for example in QR Codes.
 * For Aztec it represents the minimal percentage of error correction words.
 * Note: an Aztec symbol should have a minimum of 25% EC words.
 */
@property (nonatomic, strong) ZXQRCodeErrorCorrectionLevel *errorCorrectionLevel;

/**
 * Specifies what degree of error correction to use, for example in PDF417 Codes.
 * For PDF417 valid values are 0 to 8.
 */
@property (nonatomic, strong) NSNumber *errorCorrectionLevelPDF417;

/**
 * Specifies what percent of error correction to use.
 * For Aztec it represents the minimal percentage of error correction words.
 * Note: an Aztec symbol should have a minimum of 25% EC words.
 */
@property (nonatomic, strong) NSNumber *errorCorrectionPercent;

/**
 * Specifies margin, in pixels, to use when generating the barcode. The meaning can vary
 * by format; for example it controls margin before and after the barcode horizontally for
 * most 1D formats.
 */
@property (nonatomic, strong) NSNumber *margin;

/**
 * Specifies if long lines should be drawn, only applies to {`ean13`, `ean8`}.
 */
@property (nonatomic, assign) BOOL showLongLines;

/**
 * Specifies whether to use compact mode for PDF417.
 */
@property (nonatomic, assign) BOOL pdf417Compact;

/**
 * Specifies what compaction mode to use for PDF417.
 */
@property (nonatomic, assign) ZXPDF417Compaction pdf417Compaction;

/**
 * Specifies the minimum and maximum number of rows and columns for PDF417.
 */
@property (nonatomic, strong) ZXPDF417Dimensions *pdf417Dimensions;

/**
 * Specifies the required number of layers for an Aztec code:
 *   a negative number (-1, -2, -3, -4) specifies a compact Aztec code
 *   0 indicates to use the minimum number of layers (the default)
 *   a positive number (1, 2, .. 32) specifies a normaol (non-compact) Aztec code
 */
@property (nonatomic, strong) NSNumber *aztecLayers;

/**
 * Specifies the exact version of QR code to be encoded. An integer. If the data specified
 * cannot fit within the required version, nil we be returned.
 */
@property (nonatomic, strong) NSNumber *qrVersion;

/**
 * Specifies whether the data should be encoded to the GS1 standard.
 */
@property (nonatomic, assign) BOOL gs1Format;

@end
