/*
 * Copyright 2013 ZXing authors
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

#import "ZXBitMatrix.h"
#import "ZXByteMatrix.h"
#import "ZXDataMatrixDefaultPlacement.h"
#import "ZXDataMatrixErrorCorrection.h"
#import "ZXDataMatrixHighLevelEncoder.h"
#import "ZXDataMatrixSymbolInfo.h"
#import "ZXDataMatrixWriter.h"
#import "ZXDimension.h"
#import "ZXEncodeHints.h"

@implementation ZXDataMatrixWriter

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height error:(NSError **)error {
  return [self encode:contents format:format width:width height:height hints:nil error:error];
}

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if (contents.length == 0) {
    [NSException raise:NSInvalidArgumentException format:@"Found empty contents"];
  }

  if (format != kBarcodeFormatDataMatrix) {
    [NSException raise:NSInvalidArgumentException format:@"Can only encode kBarcodeFormatDataMatrix"];
  }

  if (width < 0 || height < 0) {
    [NSException raise:NSInvalidArgumentException format:@"Requested dimensions cannot be negative: %dx%d", width, height];
  }

  // Try to get force shape & min / max size
  ZXDataMatrixSymbolShapeHint shape = ZXDataMatrixSymbolShapeHintForceNone;
  ZXDimension *minSize = nil;
  ZXDimension *maxSize = nil;
  if (hints != nil) {
    shape = hints.dataMatrixShape;
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    ZXDimension *requestedMinSize = hints.minSize;
#pragma GCC diagnostic pop
    if (requestedMinSize != nil) {
      minSize = requestedMinSize;
    }
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    ZXDimension *requestedMaxSize = hints.maxSize;
#pragma GCC diagnostic pop
    if (requestedMaxSize != nil) {
      maxSize = requestedMaxSize;
    }
  }

  //1. step: Data encodation
  NSString *encoded = [ZXDataMatrixHighLevelEncoder encodeHighLevel:contents shape:shape minSize:minSize maxSize:maxSize];

  ZXDataMatrixSymbolInfo *symbolInfo = [ZXDataMatrixSymbolInfo lookup:(int)encoded.length shape:shape minSize:minSize maxSize:maxSize fail:YES];

  //2. step: ECC generation
  NSString *codewords = [ZXDataMatrixErrorCorrection encodeECC200:encoded symbolInfo:symbolInfo];

  //3. step: Module placement in Matrix
  ZXDataMatrixDefaultPlacement *placement = [[ZXDataMatrixDefaultPlacement alloc] initWithCodewords:codewords numcols:symbolInfo.symbolDataWidth numrows:symbolInfo.symbolDataHeight];
  [placement place];

  //4. step: low-level encoding
  return [self encodeLowLevel:placement symbolInfo:symbolInfo width:width height:height];
}

/**
 * Encode the given symbol info to a bit matrix.
 *
 * @param placement  The DataMatrix placement.
 * @param symbolInfo The symbol info to encode.
 * @return The bit matrix generated.
 */
- (ZXBitMatrix *)encodeLowLevel:(ZXDataMatrixDefaultPlacement *)placement symbolInfo:(ZXDataMatrixSymbolInfo *)symbolInfo width:(int)width height:(int)height {
  int symbolWidth = symbolInfo.symbolDataWidth;
  int symbolHeight = symbolInfo.symbolDataHeight;

  ZXByteMatrix *matrix = [[ZXByteMatrix alloc] initWithWidth:symbolInfo.symbolWidth height:symbolInfo.symbolHeight];

  int matrixY = 0;

  for (int y = 0; y < symbolHeight; y++) {
    // Fill the top edge with alternate 0 / 1
    int matrixX;
    if ((y % symbolInfo.matrixHeight) == 0) {
      matrixX = 0;
      for (int x = 0; x < symbolInfo.symbolWidth; x++) {
        [matrix setX:matrixX y:matrixY boolValue:(x % 2) == 0];
        matrixX++;
      }
      matrixY++;
    }
    matrixX = 0;
    for (int x = 0; x < symbolWidth; x++) {
      // Fill the right edge with full 1
      if ((x % symbolInfo.matrixWidth) == 0) {
        [matrix setX:matrixX y:matrixY boolValue:YES];
        matrixX++;
      }
      [matrix setX:matrixX y:matrixY boolValue:[placement bitAtCol:x row:y]];
      matrixX++;
      // Fill the right edge with alternate 0 / 1
      if ((x % symbolInfo.matrixWidth) == symbolInfo.matrixWidth - 1) {
        [matrix setX:matrixX y:matrixY boolValue:(y % 2) == 0];
        matrixX++;
      }
    }
    matrixY++;
    // Fill the bottom edge with full 1
    if ((y % symbolInfo.matrixHeight) == symbolInfo.matrixHeight - 1) {
      matrixX = 0;
      for (int x = 0; x < symbolInfo.symbolWidth; x++) {
        [matrix setX:matrixX y:matrixY boolValue:YES];
        matrixX++;
      }
      matrixY++;
    }
  }

  return [self convertByteMatrixToBitMatrix:matrix width:width height:height];
}

/**
 * Convert the ZXByteMatrix to ZXBitMatrix.
 *
 * @param matrix The input matrix.
 * @param width The requested width of the image (in pixels) with the Datamatrix code
 * @param height The requested height of the image (in pixels) with the Datamatrix code
 * @return The output matrix.
 */
- (ZXBitMatrix *)convertByteMatrixToBitMatrix:(ZXByteMatrix *)matrix width:(int)width height:(int)height {
  int matrixWidth = matrix.width;
  int matrixHeight = matrix.height;
  int outputWidth = MAX(width, matrixWidth);
  int outputHeight = MAX(height, matrixHeight);

  int multiple = MIN(outputWidth / matrixWidth, outputHeight / matrixHeight);

  int leftPadding = (outputWidth - (matrixWidth * multiple)) / 2;
  int topPadding = (outputHeight - (matrixHeight * multiple)) / 2;

  ZXBitMatrix *output;

  // remove padding if requested width and height are too small
  if (height < matrixHeight || width < matrixWidth) {
    leftPadding = 0;
    topPadding = 0;
    output = [[ZXBitMatrix alloc] initWithWidth:matrixWidth height:matrixHeight];
  } else {
    output = [[ZXBitMatrix alloc] initWithWidth:width height:height];
  }

  for (int inputY = 0, outputY = topPadding; inputY < matrixHeight; inputY++, outputY += multiple) {
    for (int inputX = 0, outputX = leftPadding; inputX < matrixWidth; inputX++, outputX += multiple) {
      if ([matrix getX:inputX y:inputY] == 1) {
        [output setRegionAtLeft:outputX top:outputY width:multiple height:multiple];
      }
    }
  }
  return output;
}

@end
