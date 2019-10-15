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

#import "ZXAztecDecoder.h"
#import "ZXAztecDetector.h"
#import "ZXAztecDetectorResult.h"
#import "ZXAztecReader.h"
#import "ZXBinaryBitmap.h"
#import "ZXDecodeHints.h"
#import "ZXDecoderResult.h"
#import "ZXReader.h"
#import "ZXResult.h"
#import "ZXResultPointCallback.h"

@implementation ZXAztecReader

- (ZXResult *)decode:(ZXBinaryBitmap *)image error:(NSError **)error {
  return [self decode:image hints:nil error:error];
}

- (ZXResult *)decode:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXBitMatrix *matrix = [image blackMatrixWithError:error];
  if (!matrix) {
    return nil;
  }

  ZXAztecDetector *detector = [[ZXAztecDetector alloc] initWithImage:matrix];
  NSArray *points = nil;
  ZXDecoderResult *decoderResult = nil;

  ZXAztecDetectorResult *detectorResult = [detector detectWithMirror:NO error:error];
  if (detectorResult) {
    points = detectorResult.points;
    decoderResult = [[[ZXAztecDecoder alloc] init] decode:detectorResult error:error];
  }

  if (decoderResult == nil) {
    detectorResult = [detector detectWithMirror:YES error:nil];
    points = detectorResult.points;
    if (detectorResult) {
      decoderResult = [[[ZXAztecDecoder alloc] init] decode:detectorResult error:nil];
    }
  }

  if (!decoderResult) {
    return nil;
  }

  if (hints != nil) {
    id <ZXResultPointCallback> rpcb = hints.resultPointCallback;
    if (rpcb != nil) {
      for (ZXResultPoint *p in points) {
        [rpcb foundPossibleResultPoint:p];
      }
    }
  }

  ZXResult *result = [ZXResult resultWithText:decoderResult.text rawBytes:decoderResult.rawBytes numBits:decoderResult.numBits resultPoints:points format:kBarcodeFormatAztec];

  NSMutableArray *byteSegments = decoderResult.byteSegments;
  if (byteSegments != nil) {
    [result putMetadata:kResultMetadataTypeByteSegments value:byteSegments];
  }
  NSString *ecLevel = decoderResult.ecLevel;
  if (ecLevel != nil) {
    [result putMetadata:kResultMetadataTypeErrorCorrectionLevel value:ecLevel];
  }

  return result;
}

- (void)reset {
  // do nothing
}

@end
