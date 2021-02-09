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

#import "ZXEAN13Reader.h"
#import "ZXErrors.h"
#import "ZXResult.h"
#import "ZXUPCAReader.h"

@interface ZXUPCAReader ()

@property (nonatomic, strong, readonly) ZXUPCEANReader *ean13Reader;

@end

@implementation ZXUPCAReader

- (id)init {
  if (self = [super init]) {
    _ean13Reader = [[ZXEAN13Reader alloc] init];
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row startGuardRange:(NSRange)startGuardRange hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXResult *result = [self.ean13Reader decodeRow:rowNumber row:row startGuardRange:startGuardRange hints:hints error:error];
  if (result) {
    result = [self maybeReturnResult:result];
    if (!result) {
      if (error) *error = ZXFormatErrorInstance();
      return nil;
    }
    return result;
  } else {
    return nil;
  }
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXResult *result = [self.ean13Reader decodeRow:rowNumber row:row hints:hints error:error];
  if (result) {
    result = [self maybeReturnResult:result];
    if (!result) {
      if (error) *error = ZXFormatErrorInstance();
      return nil;
    }
    return result;
  } else {
    return nil;
  }
}

- (ZXResult *)decode:(ZXBinaryBitmap *)image error:(NSError **)error {
  ZXResult *result = [self.ean13Reader decode:image error:error];
  if (result) {
    result = [self maybeReturnResult:result];
    if (!result) {
      if (error) *error = ZXFormatErrorInstance();
      return nil;
    }
    return result;
  } else {
    return nil;
  }
}

- (ZXResult *)decode:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXResult *result = [self.ean13Reader decode:image hints:hints error:error];
  if (result) {
    result = [self maybeReturnResult:result];
    if (!result) {
      if (error) *error = ZXFormatErrorInstance();
      return nil;
    }
    return result;
  } else {
    return nil;
  }
}

- (ZXBarcodeFormat)barcodeFormat {
  return kBarcodeFormatUPCA;
}

- (int)decodeMiddle:(ZXBitArray *)row startRange:(NSRange)startRange result:(NSMutableString *)result error:(NSError **)error {
  return [self.ean13Reader decodeMiddle:row startRange:startRange result:result error:error];
}

- (ZXResult *)maybeReturnResult:(ZXResult *)result {
  NSString *text = result.text;
  if ([text characterAtIndex:0] == '0') {
    ZXResult *upcaResult = [ZXResult resultWithText:[text substringFromIndex:1]
                                           rawBytes:nil
                                       resultPoints:result.resultPoints
                                             format:kBarcodeFormatUPCA];
    [upcaResult putAllMetadata:[result resultMetadata]];
    return upcaResult;
  } else {
    return nil;
  }
}

@end
