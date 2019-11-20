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

#import "ZXDecoderResult.h"

@implementation ZXDecoderResult

- (id)initWithRawBytes:(ZXByteArray *)rawBytes text:(NSString *)text
          byteSegments:(NSMutableArray *)byteSegments ecLevel:(NSString *)ecLevel {
  return [self initWithRawBytes:rawBytes text:text byteSegments:byteSegments ecLevel:ecLevel saSequence:-1 saParity:-1];
}

- (id)initWithRawBytes:(ZXByteArray *)rawBytes text:(NSString *)text
          byteSegments:(NSMutableArray *)byteSegments ecLevel:(NSString *)ecLevel
            saSequence:(int)saSequence saParity:(int)saParity {
  if (self = [super init]) {
    _rawBytes = rawBytes;
    _numBits = rawBytes == nil ? 0 : 8 * rawBytes.length;
    _text = text;
    _byteSegments = byteSegments;
    _ecLevel = ecLevel;
    _structuredAppendParity = saParity;
    _structuredAppendSequenceNumber = saSequence;
  }

  return self;
}

- (BOOL)hasStructuredAppend {
  return self.structuredAppendParity >= 0 && self.structuredAppendSequenceNumber >= 0;
}

@end
