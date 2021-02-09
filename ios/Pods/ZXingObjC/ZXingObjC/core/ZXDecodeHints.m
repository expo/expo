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
#import "ZXResultPointCallback.h"

@interface ZXDecodeHints ()

@property (nonatomic, strong, readonly) NSMutableArray *barcodeFormats;

@end

@implementation ZXDecodeHints

- (id)init {
  if (self = [super init]) {
    _barcodeFormats = [NSMutableArray array];
  }

  return self;
}

+ (id)hints {
  return [[self alloc] init];
}

- (id)copyWithZone:(NSZone *)zone {
  ZXDecodeHints *result = [[[self class] allocWithZone:zone] init];
  if (result) {
    result.assumeCode39CheckDigit = self.assumeCode39CheckDigit;
    result.allowedLengths = [self.allowedLengths copy];

    for (NSNumber *formatNumber in self.barcodeFormats) {
      [result addPossibleFormat:[formatNumber intValue]];
    }

    result.encoding = self.encoding;
    result.other = self.other;
    result.pureBarcode = self.pureBarcode;
    result.returnCodaBarStartEnd = self.returnCodaBarStartEnd;
    result.resultPointCallback = self.resultPointCallback;
    result.tryHarder = self.tryHarder;
  }

  return result;
}

- (void)addPossibleFormat:(ZXBarcodeFormat)format {
  [self.barcodeFormats addObject:@(format)];
}

- (BOOL)containsFormat:(ZXBarcodeFormat)format {
  return [self.barcodeFormats containsObject:@(format)];
}

- (int)numberOfPossibleFormats {
  return (int)self.barcodeFormats.count;
}

- (void)removePossibleFormat:(ZXBarcodeFormat)format {
  [self.barcodeFormats removeObject:@(format)];
}

@end
