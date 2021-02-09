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

#import "ZXAI01weightDecoder.h"
#import "ZXRSSExpandedGeneralAppIdDecoder.h"

@implementation ZXAI01weightDecoder

- (void)encodeCompressedWeight:(NSMutableString *)buf currentPos:(int)currentPos weightSize:(int)weightSize {
  int originalWeightNumeric = [self.generalDecoder extractNumericValueFromBitArray:currentPos bits:weightSize];
  [self addWeightCode:buf weight:originalWeightNumeric];

  int weightNumeric = [self checkWeight:originalWeightNumeric];

  int currentDivisor = 100000;
  for (int i = 0; i < 5; ++i) {
    if (weightNumeric / currentDivisor == 0) {
      [buf appendString:@"0"];
    }
    currentDivisor /= 10;
  }

  [buf appendFormat:@"%d", weightNumeric];
}

- (void)addWeightCode:(NSMutableString *)buf weight:(int)weight {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

- (int)checkWeight:(int)weight {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

@end
