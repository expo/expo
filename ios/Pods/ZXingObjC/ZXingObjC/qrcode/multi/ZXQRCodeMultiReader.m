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

#import "ZXByteArray.h"
#import "ZXDecoderResult.h"
#import "ZXDetectorResult.h"
#import "ZXMultiDetector.h"
#import "ZXQRCodeDecoder.h"
#import "ZXQRCodeDecoderMetaData.h"
#import "ZXQRCodeMultiReader.h"
#import "ZXResult.h"

@implementation ZXQRCodeMultiReader

- (NSArray *)decodeMultiple:(ZXBinaryBitmap *)image error:(NSError **)error {
  return [self decodeMultiple:image hints:nil error:error];
}

- (NSArray *)decodeMultiple:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXBitMatrix *matrix = [image blackMatrixWithError:error];
  if (!matrix) {
    return nil;
  }
  NSMutableArray *results = [NSMutableArray array];
  NSArray *detectorResults = [[[ZXMultiDetector alloc] initWithImage:matrix] detectMulti:hints error:error];
  if (!detectorResults) {
    return nil;
  }
  for (ZXDetectorResult *detectorResult in detectorResults) {
    ZXDecoderResult *decoderResult = [[self decoder] decodeMatrix:[detectorResult bits] hints:hints error:nil];
    if (decoderResult) {
      NSMutableArray *points = [[detectorResult points] mutableCopy];
      // If the code was mirrored: swap the bottom-left and the top-right points.
      if ([decoderResult.other isKindOfClass:[ZXQRCodeDecoderMetaData class]]) {
        [(ZXQRCodeDecoderMetaData *)decoderResult.other applyMirroredCorrection:points];
      }
      ZXResult *result = [ZXResult resultWithText:decoderResult.text
                                         rawBytes:decoderResult.rawBytes
                                     resultPoints:points
                                           format:kBarcodeFormatQRCode];
      NSMutableArray *byteSegments = decoderResult.byteSegments;
      if (byteSegments != nil) {
        [result putMetadata:kResultMetadataTypeByteSegments value:byteSegments];
      }
      NSString *ecLevel = decoderResult.ecLevel;
      if (ecLevel != nil) {
        [result putMetadata:kResultMetadataTypeErrorCorrectionLevel value:ecLevel];
      }
      if ([decoderResult hasStructuredAppend]) {
        [result putMetadata:kResultMetadataTypeStructuredAppendSequence
                      value:@(decoderResult.structuredAppendSequenceNumber)];
        [result putMetadata:kResultMetadataTypeStructuredAppendParity
                      value:@(decoderResult.structuredAppendParity)];
      }
      [results addObject:result];
    }
  }

  results = [self processStructuredAppend:results];
  return results;
}

- (NSMutableArray *)processStructuredAppend:(NSMutableArray *)results {
  BOOL hasSA = NO;

  // first, check, if there is at least on SA result in the list
  for (ZXResult *result in results) {
    if (result.resultMetadata[@(kResultMetadataTypeStructuredAppendSequence)]) {
      hasSA = YES;
      break;
    }
  }
  if (!hasSA) {
    return results;
  }

  // it is, second, split the lists and built a new result list
  NSMutableArray *newResults = [NSMutableArray array];
  NSMutableArray *saResults = [NSMutableArray array];
  for (ZXResult *result in results) {
    [newResults addObject:result];
    if (result.resultMetadata[@(kResultMetadataTypeStructuredAppendSequence)]) {
      [saResults addObject:result];
    }
  }
  // sort and concatenate the SA list items
  [saResults sortUsingComparator:^NSComparisonResult(ZXResult *a, ZXResult *b) {
    int aNumber = [a.resultMetadata[@(kResultMetadataTypeStructuredAppendSequence)] intValue];
    int bNumber = [b.resultMetadata[@(kResultMetadataTypeStructuredAppendSequence)] intValue];
    if (aNumber < bNumber) {
      return NSOrderedAscending;
    }
    if (aNumber > bNumber) {
      return NSOrderedDescending;
    }
    return NSOrderedSame;
  }];
  NSMutableString *concatedText = [NSMutableString string];
  int rawBytesLen = 0;
  int byteSegmentLength = 0;
  for (ZXResult *saResult in saResults) {
    [concatedText appendString:saResult.text];
    rawBytesLen += saResult.rawBytes.length;
    if (saResult.resultMetadata[@(kResultMetadataTypeByteSegments)]) {
      for (ZXByteArray *segment in saResult.resultMetadata[@(kResultMetadataTypeByteSegments)]) {
        byteSegmentLength += segment.length;
      }
    }
  }
  ZXByteArray *newRawBytes = [[ZXByteArray alloc] initWithLength:rawBytesLen];
  ZXByteArray *newByteSegment = [[ZXByteArray alloc] initWithLength:byteSegmentLength];
  int newRawBytesIndex = 0;
  int byteSegmentIndex = 0;
  for (ZXResult *saResult in saResults) {
    memcpy(newRawBytes.array, saResult.rawBytes.array, saResult.rawBytes.length * sizeof(int8_t));
    newRawBytesIndex += saResult.rawBytes.length;
    if (saResult.resultMetadata[@(kResultMetadataTypeByteSegments)]) {
      for (ZXByteArray *segment in saResult.resultMetadata[@(kResultMetadataTypeByteSegments)]) {
        memcpy(newByteSegment.array, segment.array, segment.length * sizeof(int8_t));
        byteSegmentIndex += segment.length;
      }
    }
  }
  ZXResult *newResult = [[ZXResult alloc] initWithText:concatedText rawBytes:newRawBytes resultPoints:@[] format:kBarcodeFormatQRCode];
  if (byteSegmentLength > 0) {
    NSMutableArray *byteSegmentList = [NSMutableArray array];
    [byteSegmentList addObject:newByteSegment];
    [newResult putMetadata:kResultMetadataTypeByteSegments value:byteSegmentList];
  }
  [newResults addObject:newResult];
  return newResults;
}

@end
