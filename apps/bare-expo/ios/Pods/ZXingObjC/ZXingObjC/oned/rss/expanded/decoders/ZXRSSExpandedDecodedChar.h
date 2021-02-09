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

extern unichar const ZX_FNC1_CHAR;

@interface ZXRSSExpandedDecodedChar : ZXRSSExpandedDecodedObject

@property (nonatomic, assign, readonly) unichar value;

- (id)initWithNewPosition:(int)newPosition value:(unichar)value;
- (BOOL)fnc1;

@end
