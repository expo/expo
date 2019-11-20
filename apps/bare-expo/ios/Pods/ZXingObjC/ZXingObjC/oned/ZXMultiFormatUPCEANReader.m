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

#import "ZXDecodeHints.h"
#import "ZXEAN8Reader.h"
#import "ZXEAN13Reader.h"
#import "ZXErrors.h"
#import "ZXMultiFormatUPCEANReader.h"
#import "ZXReader.h"
#import "ZXResult.h"
#import "ZXUPCAReader.h"
#import "ZXUPCEReader.h"

@interface ZXMultiFormatUPCEANReader ()

@property (nonatomic, strong, readonly) NSMutableArray *readers;

@end

@implementation ZXMultiFormatUPCEANReader

- (id)initWithHints:(ZXDecodeHints *)hints {
  if (self = [super init]) {
    _readers = [NSMutableArray array];

    if (hints != nil) {
      if ([hints containsFormat:kBarcodeFormatEan13]) {
        [_readers addObject:[[ZXEAN13Reader alloc] init]];
      } else if ([hints containsFormat:kBarcodeFormatUPCA]) {
        [_readers addObject:[[ZXUPCAReader alloc] init]];
      }

      if ([hints containsFormat:kBarcodeFormatEan8]) {
        [_readers addObject:[[ZXEAN8Reader alloc] init]];
      }

      if ([hints containsFormat:kBarcodeFormatUPCE]) {
        [_readers addObject:[[ZXUPCEReader alloc] init]];
      }
    }

    if ([_readers count] == 0) {
      [_readers addObject:[[ZXEAN13Reader alloc] init]];
      [_readers addObject:[[ZXEAN8Reader alloc] init]];
      [_readers addObject:[[ZXUPCEReader alloc] init]];
    }
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  NSRange startGuardPattern = [ZXUPCEANReader findStartGuardPattern:row error:error];
  if (startGuardPattern.location == NSNotFound) {
    return nil;
  }
  for (ZXUPCEANReader *reader in self.readers) {
    ZXResult *result = [reader decodeRow:rowNumber row:row startGuardRange:startGuardPattern hints:hints error:error];
    if (!result) {
      continue;
    }

    // Special case: a 12-digit code encoded in UPC-A is identical to a "0"
    // followed by those 12 digits encoded as EAN-13. Each will recognize such a code,
    // UPC-A as a 12-digit string and EAN-13 as a 13-digit string starting with "0".
    // Individually these are correct and their readers will both read such a code
    // and correctly call it EAN-13, or UPC-A, respectively.
    //
    // In this case, if we've been looking for both types, we'd like to call it
    // a UPC-A code. But for efficiency we only run the EAN-13 decoder to also read
    // UPC-A. So we special case it here, and convert an EAN-13 result to a UPC-A
    // result if appropriate.
    //
    // But, don't return UPC-A if UPC-A was not a requested format!
    BOOL ean13MayBeUPCA = kBarcodeFormatEan13 == result.barcodeFormat && [result.text characterAtIndex:0] == '0';
    BOOL canReturnUPCA = hints == nil || [hints numberOfPossibleFormats] == 0 || [hints containsFormat:kBarcodeFormatUPCA];
    if (ean13MayBeUPCA && canReturnUPCA) {
      // Transfer the metdata across
      ZXResult *resultUPCA = [ZXResult resultWithText:[result.text substringFromIndex:1]
                                             rawBytes:result.rawBytes
                                         resultPoints:result.resultPoints
                                               format:kBarcodeFormatUPCA];
      [resultUPCA putAllMetadata:result.resultMetadata];
      return resultUPCA;
    }
    return result;
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
