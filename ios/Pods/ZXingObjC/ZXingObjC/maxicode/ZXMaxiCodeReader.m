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
#import "ZXBitMatrix.h"
#import "ZXDecodeHints.h"
#import "ZXDecoderResult.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXMaxiCodeDecoder.h"
#import "ZXMaxiCodeReader.h"
#import "ZXResult.h"

const int ZX_MATRIX_WIDTH = 30;
const int ZX_MATRIX_HEIGHT = 33;

@interface ZXMaxiCodeReader ()

@property (nonatomic, strong, readonly) ZXMaxiCodeDecoder *decoder;

@end

@implementation ZXMaxiCodeReader

- (id)init {
  if (self = [super init]) {
    _decoder = [[ZXMaxiCodeDecoder alloc] init];
  }

  return self;
}

/**
 * Locates and decodes a MaxiCode in an image.
 *
 * @return a String representing the content encoded by the MaxiCode
 * @return nil if a MaxiCode cannot be found
 * @return nil if a MaxiCode cannot be decoded
 * @return nil if error correction fails
 */
- (ZXResult *)decode:(ZXBinaryBitmap *)image error:(NSError **)error {
  return [self decode:image hints:nil error:error];
}

- (ZXResult *)decode:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXDecoderResult *decoderResult;
  if (hints != nil && hints.pureBarcode) {
    ZXBitMatrix *matrix = [image blackMatrixWithError:error];
    if (!matrix) {
      return nil;
    }
    ZXBitMatrix *bits = [self extractPureBits:matrix];
    if (!bits) {
      if (error) *error = ZXNotFoundErrorInstance();
      return nil;
    }
    decoderResult = [self.decoder decode:bits hints:hints error:error];
    if (!decoderResult) {
      return nil;
    }
  } else {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  NSArray *points = @[];
  ZXResult *result = [ZXResult resultWithText:decoderResult.text
                                      rawBytes:decoderResult.rawBytes
                                  resultPoints:points
                                        format:kBarcodeFormatMaxiCode];

  NSString *ecLevel = decoderResult.ecLevel;
  if (ecLevel != nil) {
    [result putMetadata:kResultMetadataTypeErrorCorrectionLevel value:ecLevel];
  }
  return result;
}

- (void)reset {
  // do nothing
}

/**
 * This method detects a code in a "pure" image -- that is, pure monochrome image
 * which contains only an unrotated, unskewed, image of a code, with some white border
 * around it. This is a specialized method that works exceptionally fast in this special
 * case.
 */
- (ZXBitMatrix *)extractPureBits:(ZXBitMatrix *)image {
  ZXIntArray *enclosingRectangle = image.enclosingRectangle;
  if (enclosingRectangle == nil) {
    return nil;
  }

  int left = enclosingRectangle.array[0];
  int top = enclosingRectangle.array[1];
  int width = enclosingRectangle.array[2];
  int height = enclosingRectangle.array[3];

  // Now just read off the bits
  ZXBitMatrix *bits = [[ZXBitMatrix alloc] initWithWidth:ZX_MATRIX_WIDTH height:ZX_MATRIX_HEIGHT];
  for (int y = 0; y < ZX_MATRIX_HEIGHT; y++) {
    int iy = top + (y * height + height / 2) / ZX_MATRIX_HEIGHT;
    for (int x = 0; x < ZX_MATRIX_WIDTH; x++) {
      int ix = left + (x * width + width / 2 + (y & 0x01) *  width / 2) / ZX_MATRIX_WIDTH;
      if ([image getX:ix y:iy]) {
        [bits setX:x y:y];
      }
    }
  }

  return bits;
}

@end
