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

#import "ZXBitMatrix.h"
#import "ZXByteMatrix.h"
#import "ZXEncodeHints.h"
#import "ZXQRCode.h"
#import "ZXQRCodeEncoder.h"
#import "ZXQRCodeErrorCorrectionLevel.h"
#import "ZXQRCodeWriter.h"

const int ZX_QUIET_ZONE_SIZE = 4;

@implementation ZXQRCodeWriter

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height error:(NSError **)error {
  return [self encode:contents format:format width:width height:height hints:nil error:error];
}

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if ([contents length] == 0) {
    [NSException raise:NSInvalidArgumentException format:@"Found empty contents"];
  }

  if (format != kBarcodeFormatQRCode) {
    [NSException raise:NSInvalidArgumentException format:@"Can only encode QR_CODE"];
  }

  if (width < 0 || height < 0) {
    [NSException raise:NSInvalidArgumentException format:@"Requested dimensions are too small: %dx%d", width, height];
  }

  ZXQRCodeErrorCorrectionLevel *errorCorrectionLevel = [ZXQRCodeErrorCorrectionLevel errorCorrectionLevelL];
  int quietZone = ZX_QUIET_ZONE_SIZE;
  if (hints != nil) {
    if (hints.errorCorrectionLevel) {
      errorCorrectionLevel = hints.errorCorrectionLevel;
    }
    if (hints.margin) {
      quietZone = [hints.margin intValue];
    }
  }

  ZXQRCode *code = [ZXQRCodeEncoder encode:contents ecLevel:errorCorrectionLevel hints:hints error:error];
  return [self renderResult:code width:width height:height quietZone:quietZone];
}

- (ZXBitMatrix *)renderResult:(ZXQRCode *)code width:(int)width height:(int)height quietZone:(int)quietZone {
  ZXByteMatrix *input = code.matrix;
  if (input == nil) {
    return nil;
  }
  int inputWidth = input.width;
  int inputHeight = input.height;
  int qrWidth = inputWidth + (quietZone * 2);
  int qrHeight = inputHeight + (quietZone * 2);
  int outputWidth = MAX(width, qrWidth);
  int outputHeight = MAX(height, qrHeight);

  int multiple = MIN(outputWidth / qrWidth, outputHeight / qrHeight);
  // Padding includes both the quiet zone and the extra white pixels to accommodate the requested
  // dimensions. For example, if input is 25x25 the QR will be 33x33 including the quiet zone.
  // If the requested size is 200x160, the multiple will be 4, for a QR of 132x132. These will
  // handle all the padding from 100x100 (the actual QR) up to 200x160.
  int leftPadding = (outputWidth - (inputWidth * multiple)) / 2;
  int topPadding = (outputHeight - (inputHeight * multiple)) / 2;

  ZXBitMatrix *output = [[ZXBitMatrix alloc] initWithWidth:outputWidth height:outputHeight];

  for (int inputY = 0, outputY = topPadding; inputY < inputHeight; inputY++, outputY += multiple) {
    for (int inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
      if ([input getX:inputX y:inputY] == 1) {
        [output setRegionAtLeft:outputX top:outputY width:multiple height:multiple];
      }
    }
  }

  return output;
}

@end
