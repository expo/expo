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

#import "ZXCodaBarReader.h"
#import "ZXCode128Reader.h"
#import "ZXCode39Reader.h"
#import "ZXCode93Reader.h"
#import "ZXDecodeHints.h"
#import "ZXErrors.h"
#import "ZXITFReader.h"
#import "ZXMultiFormatOneDReader.h"
#import "ZXMultiFormatUPCEANReader.h"
#import "ZXRSS14Reader.h"
#import "ZXRSSExpandedReader.h"

@interface ZXMultiFormatOneDReader ()

@property (nonatomic, strong, readonly) NSMutableArray *readers;

@end

@implementation ZXMultiFormatOneDReader

- (id)initWithHints:(ZXDecodeHints *)hints {
  if (self = [super init]) {
    BOOL useCode39CheckDigit = hints != nil && hints.assumeCode39CheckDigit;
    _readers = [NSMutableArray array];
    if (hints != nil) {
      if ([hints containsFormat:kBarcodeFormatEan13] ||
          [hints containsFormat:kBarcodeFormatUPCA] ||
          [hints containsFormat:kBarcodeFormatEan8] ||
          [hints containsFormat:kBarcodeFormatUPCE]) {
        [_readers addObject:[[ZXMultiFormatUPCEANReader alloc] initWithHints:hints]];
      }

      if ([hints containsFormat:kBarcodeFormatCode39]) {
        [_readers addObject:[[ZXCode39Reader alloc] initUsingCheckDigit:useCode39CheckDigit]];
      }

      if ([hints containsFormat:kBarcodeFormatCode93]) {
        [_readers addObject:[[ZXCode93Reader alloc] init]];
      }

      if ([hints containsFormat:kBarcodeFormatCode128]) {
        [_readers addObject:[[ZXCode128Reader alloc] init]];
      }

      if ([hints containsFormat:kBarcodeFormatITF]) {
        [_readers addObject:[[ZXITFReader alloc] init]];
      }

      if ([hints containsFormat:kBarcodeFormatCodabar]) {
        [_readers addObject:[[ZXCodaBarReader alloc] init]];
      }

      if ([hints containsFormat:kBarcodeFormatRSS14]) {
        [_readers addObject:[[ZXRSS14Reader alloc] init]];
      }

      if ([hints containsFormat:kBarcodeFormatRSSExpanded]) {
        [_readers addObject:[[ZXRSSExpandedReader alloc] init]];
      }
    }

    if ([_readers count] == 0) {
      [_readers addObject:[[ZXMultiFormatUPCEANReader alloc] initWithHints:hints]];
      [_readers addObject:[[ZXCode39Reader alloc] init]];
      [_readers addObject:[[ZXCodaBarReader alloc] init]];
      [_readers addObject:[[ZXCode93Reader alloc] init]];
      [_readers addObject:[[ZXCode128Reader alloc] init]];
      [_readers addObject:[[ZXITFReader alloc] init]];
      [_readers addObject:[[ZXRSS14Reader alloc] init]];
      [_readers addObject:[[ZXRSSExpandedReader alloc] init]];
    }
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  for (ZXOneDReader *reader in self.readers) {
    ZXResult *result = [reader decodeRow:rowNumber row:row hints:hints error:error];
    if (result) {
      return result;
    }
  }

  if (error) *error = ZXNotFoundErrorInstance();
  return nil;
}

- (void)reset {
  for (id<ZXReader> reader in self.readers) {
    [reader reset];
  }
}

@end
