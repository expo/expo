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

#import "ZXRSSExpandedDecodedObject.h"

extern const int ZX_FNC1_INT;

@interface ZXRSSExpandedDecodedNumeric : ZXRSSExpandedDecodedObject

@property (nonatomic, assign, readonly) int firstDigit;
@property (nonatomic, assign, readonly) int secondDigit;
@property (nonatomic, assign, readonly) int value;

- (id)initWithNewPosition:(int)newPosition firstDigit:(int)firstDigit secondDigit:(int)secondDigit;
- (BOOL)firstDigitFNC1;
- (BOOL)secondDigitFNC1;
- (BOOL)anyFNC1;

@end
