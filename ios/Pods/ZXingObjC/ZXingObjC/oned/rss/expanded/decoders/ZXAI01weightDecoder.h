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

#import "ZXAI01decoder.h"

@interface ZXAI01weightDecoder : ZXAI01decoder

- (void)encodeCompressedWeight:(NSMutableString *)buf currentPos:(int)currentPos weightSize:(int)weightSize;
- (void)addWeightCode:(NSMutableString *)buf weight:(int)weight;
- (int)checkWeight:(int)weight;

@end
