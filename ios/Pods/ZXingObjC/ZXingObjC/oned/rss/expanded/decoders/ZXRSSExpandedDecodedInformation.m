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

#import "ZXRSSExpandedDecodedInformation.h"

@implementation ZXRSSExpandedDecodedInformation

- (id)initWithNewPosition:(int)newPosition newString:(NSString *)newString {
  if (self = [super initWithNewPosition:newPosition]) {
    _remaining = NO;
    _remainingValue = 0;
    _theNewString = newString;
  }

  return self;
}

- (id)initWithNewPosition:(int)newPosition newString:(NSString *)newString remainingValue:(int)remainingValue {
  if (self = [super initWithNewPosition:newPosition]) {
    _remaining = YES;
    _remainingValue = remainingValue;
    _theNewString = newString;
  }

  return self;
}

@end
