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

#import "ZXAztecCode.h"
#import "ZXAztecEncoder.h"
#import "ZXAztecWriter.h"
#import "ZXBitMatrix.h"
#import "ZXByteArray.h"
#import "ZXEncodeHints.h"

const NSStringEncoding ZX_AZTEC_DEFAULT_ENCODING = NSISOLatin1StringEncoding;

@implementation ZXAztecWriter

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height error:(NSError **)error {
  return [self encode:contents format:format width:width height:height hints:nil error:error];
}

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  NSStringEncoding encoding = hints.encoding;
  NSNumber *eccPercent = hints.errorCorrectionPercent;
  NSNumber *layers = hints.aztecLayers;

  return [self encode:contents
               format:format
                width:width
               height:height
             encoding:encoding == 0 ? ZX_AZTEC_DEFAULT_ENCODING : encoding
           eccPercent:eccPercent == nil ? ZX_AZTEC_DEFAULT_EC_PERCENT : [eccPercent intValue]
               layers:layers == nil ? ZX_AZTEC_DEFAULT_LAYERS : [layers intValue]];
}

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width
                 height:(int)height encoding:(NSStringEncoding)encoding eccPercent:(int)eccPercent layers:(int)layers {
  if (format != kBarcodeFormatAztec) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:[NSString stringWithFormat:@"Can only encode kBarcodeFormatAztec (%d), but got %d", kBarcodeFormatAztec, format]
                                 userInfo:nil];
  }

  NSData *data = [contents dataUsingEncoding:encoding];
  ZXByteArray *bytes = [[ZXByteArray alloc] initWithLength:(unsigned int)[data length]];
  memcpy(bytes.array, [data bytes], bytes.length * sizeof(int8_t));
  ZXAztecCode *aztec = [ZXAztecEncoder encode:bytes minECCPercent:eccPercent userSpecifiedLayers:layers];
  return [self renderResult:aztec width:width height:height];
}

- (ZXBitMatrix *)renderResult:(ZXAztecCode *)aztec width:(int)width height:(int)height {
  ZXBitMatrix *input = aztec.matrix;
  if (!input) {
    return nil;
  }

  int inputWidth = input.width;
  int inputHeight = input.height;
  int outputWidth = MAX(width, inputWidth);
  int outputHeight = MAX(height, inputHeight);

  int multiple = MIN(outputWidth / inputWidth, outputHeight / inputHeight);
  int leftPadding = (outputWidth - (inputWidth * multiple)) / 2;
  int topPadding = (outputHeight - (inputHeight * multiple)) / 2;

  ZXBitMatrix *output = [[ZXBitMatrix alloc] initWithWidth:outputWidth height:outputHeight];

  for (int inputY = 0, outputY = topPadding; inputY < inputHeight; inputY++, outputY += multiple) {
    // Write the contents of this row of the barcode
    for (int inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
      if ([input getX:inputX y:inputY]) {
        [output setRegionAtLeft:outputX top:outputY width:multiple height:multiple];
      }
    }
  }
  return output;
}

@end
