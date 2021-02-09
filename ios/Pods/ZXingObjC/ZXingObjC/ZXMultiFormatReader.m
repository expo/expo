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

#import "ZXBinaryBitmap.h"
#import "ZXDecodeHints.h"
#import "ZXErrors.h"
#import "ZXMultiFormatReader.h"
#import "ZXResult.h"

#if defined(ZXINGOBJC_AZTEC) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXAztecReader.h"
#endif
#if defined(ZXINGOBJC_DATAMATRIX) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXDataMatrixReader.h"
#endif
#if defined(ZXINGOBJC_MAXICODE) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXMaxiCodeReader.h"
#endif
#if defined(ZXINGOBJC_ONED) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXMultiFormatOneDReader.h"
#endif
#if defined(ZXINGOBJC_PDF417) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXPDF417Reader.h"
#endif
#if defined(ZXINGOBJC_QRCODE) || !defined(ZXINGOBJC_USE_SUBSPECS)
#import "ZXQRCodeReader.h"
#endif

@interface ZXMultiFormatReader ()

@property (nonatomic, strong, readonly) NSMutableArray *readers;

@end

@implementation ZXMultiFormatReader

- (id)init {
  if (self = [super init]) {
    _readers = [NSMutableArray array];
  }

  return self;
}

+ (id)reader {
  return [[ZXMultiFormatReader alloc] init];
}

/**
 * This version of decode honors the intent of Reader.decode(BinaryBitmap) in that it
 * passes null as a hint to the decoders. However, that makes it inefficient to call repeatedly.
 * Use setHints() followed by decodeWithState() for continuous scan applications.
 *
 * @param image The pixel data to decode
 * @return The contents of the image or nil if any errors occurred
 */
- (ZXResult *)decode:(ZXBinaryBitmap *)image error:(NSError **)error {
  self.hints = nil;
  return [self decodeInternal:image error:error];
}

/**
 * Decode an image using the hints provided. Does not honor existing state.
 *
 * @param image The pixel data to decode
 * @param hints The hints to use, clearing the previous state.
 * @return The contents of the image or nil if any errors occurred
 */
- (ZXResult *)decode:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints error:(NSError **)error {
  self.hints = hints;
  return [self decodeInternal:image error:error];
}

- (ZXResult *)decodeWithState:(ZXBinaryBitmap *)image error:(NSError **)error {
  if (self.readers == nil) {
    self.hints = nil;
  }
  return [self decodeInternal:image error:error];
}

/**
 * This method adds state to the MultiFormatReader. By setting the hints once, subsequent calls
 * to decodeWithState(image) can reuse the same set of readers without reallocating memory. This
 * is important for performance in continuous scan clients.
 *
 * @param hints The set of hints to use for subsequent calls to decode(image)
 */
- (void)setHints:(ZXDecodeHints *)hints {
  _hints = hints;

  BOOL tryHarder = hints != nil && hints.tryHarder;
  [self.readers removeAllObjects];
  if (hints != nil) {
    BOOL addZXOneDReader = [hints containsFormat:kBarcodeFormatUPCA] ||
      [hints containsFormat:kBarcodeFormatUPCE] ||
      [hints containsFormat:kBarcodeFormatEan13] ||
      [hints containsFormat:kBarcodeFormatEan8] ||
      [hints containsFormat:kBarcodeFormatCodabar] ||
      [hints containsFormat:kBarcodeFormatCode39] ||
      [hints containsFormat:kBarcodeFormatCode93] ||
      [hints containsFormat:kBarcodeFormatCode128] ||
      [hints containsFormat:kBarcodeFormatITF] ||
      [hints containsFormat:kBarcodeFormatRSS14] ||
      [hints containsFormat:kBarcodeFormatRSSExpanded];
    if (addZXOneDReader && !tryHarder) {
#if defined(ZXINGOBJC_ONED) || !defined(ZXINGOBJC_USE_SUBSPECS)
      [self.readers addObject:[[ZXMultiFormatOneDReader alloc] initWithHints:hints]];
#endif
    }
#if defined(ZXINGOBJC_QRCODE) || !defined(ZXINGOBJC_USE_SUBSPECS)
    if ([hints containsFormat:kBarcodeFormatQRCode]) {
      [self.readers addObject:[[ZXQRCodeReader alloc] init]];
    }
#endif
#if defined(ZXINGOBJC_DATAMATRIX) || !defined(ZXINGOBJC_USE_SUBSPECS)
    if ([hints containsFormat:kBarcodeFormatDataMatrix]) {
      [self.readers addObject:[[ZXDataMatrixReader alloc] init]];
    }
#endif
#if defined(ZXINGOBJC_AZTEC) || !defined(ZXINGOBJC_USE_SUBSPECS)
    if ([hints containsFormat:kBarcodeFormatAztec]) {
      [self.readers addObject:[[ZXAztecReader alloc] init]];
    }
#endif
#if defined(ZXINGOBJC_PDF417) || !defined(ZXINGOBJC_USE_SUBSPECS)
    if ([hints containsFormat:kBarcodeFormatPDF417]) {
      [self.readers addObject:[[ZXPDF417Reader alloc] init]];
    }
#endif
#if defined(ZXINGOBJC_MAXICODE) || !defined(ZXINGOBJC_USE_SUBSPECS)
    if ([hints containsFormat:kBarcodeFormatMaxiCode]) {
      [self.readers addObject:[[ZXMaxiCodeReader alloc] init]];
    }
#endif
#if defined(ZXINGOBJC_ONED) || !defined(ZXINGOBJC_USE_SUBSPECS)
    if (addZXOneDReader && tryHarder) {
      [self.readers addObject:[[ZXMultiFormatOneDReader alloc] initWithHints:hints]];
    }
#endif
  }
  if ([self.readers count] == 0) {
    if (!tryHarder) {
#if defined(ZXINGOBJC_ONED) || !defined(ZXINGOBJC_USE_SUBSPECS)
      [self.readers addObject:[[ZXMultiFormatOneDReader alloc] initWithHints:hints]];
#endif
    }
#if defined(ZXINGOBJC_QRCODE) || !defined(ZXINGOBJC_USE_SUBSPECS)
    [self.readers addObject:[[ZXQRCodeReader alloc] init]];
#endif
#if defined(ZXINGOBJC_DATAMATRIX) || !defined(ZXINGOBJC_USE_SUBSPECS)
    [self.readers addObject:[[ZXDataMatrixReader alloc] init]];
#endif
#if defined(ZXINGOBJC_AZTEC) || !defined(ZXINGOBJC_USE_SUBSPECS)
    [self.readers addObject:[[ZXAztecReader alloc] init]];
#endif
#if defined(ZXINGOBJC_PDF417) || !defined(ZXINGOBJC_USE_SUBSPECS)
    [self.readers addObject:[[ZXPDF417Reader alloc] init]];
#endif
#if defined(ZXINGOBJC_MAXICODE) || !defined(ZXINGOBJC_USE_SUBSPECS)
    [self.readers addObject:[[ZXMaxiCodeReader alloc] init]];
#endif
    if (tryHarder) {
#if defined(ZXINGOBJC_ONED) || !defined(ZXINGOBJC_USE_SUBSPECS)
      [self.readers addObject:[[ZXMultiFormatOneDReader alloc] initWithHints:hints]];
#endif
    }
  }
}

- (void)reset {
  if (self.readers != nil) {
    for (id<ZXReader> reader in self.readers) {
      [reader reset];
    }
  }
}

- (ZXResult *)decodeInternal:(ZXBinaryBitmap *)image error:(NSError **)error {
  if (self.readers != nil) {
    for (id<ZXReader> reader in self.readers) {
      ZXResult *result = [reader decode:image hints:self.hints error:nil];
      if (result) {
        return result;
      }
    }
  }

  if (error) *error = ZXNotFoundErrorInstance();
  return nil;
}

@end
