#import "FIRInstanceIDDefines.h"

//
//  FIRInstanceIDStringEncoding.m
//
//  Copyright 2009 Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not
//  use this file except in compliance with the License.  You may obtain a copy
//  of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
//  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
//  License for the specific language governing permissions and limitations under
//  the License.
//

// This is a copy of GTMStringEncoding. FIRInstanceID wants to avoid
// a CocoaPods GTM dependency. Hence we use our own version of StringEncoding.

#import "FIRInstanceIDStringEncoding.h"

enum { kUnknownChar = -1, kPaddingChar = -2, kIgnoreChar = -3 };

@implementation FIRInstanceIDStringEncoding

+ (id)rfc4648Base64WebsafeStringEncoding {
  FIRInstanceIDStringEncoding *ret = [self
      stringEncodingWithString:@"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"];

  [ret setPaddingChar:'='];
  [ret setDoPad:YES];
  return ret;
}

static inline int lcm(int a, int b) {
  for (int aa = a, bb = b;;) {
    if (aa == bb)
      return aa;
    else if (aa < bb)
      aa += a;
    else
      bb += b;
  }
}

+ (id)stringEncodingWithString:(NSString *)string {
  return [[FIRInstanceIDStringEncoding alloc] initWithString:string];
}

- (id)initWithString:(NSString *)string {
  if ((self = [super init])) {
    charMapData_ = [string dataUsingEncoding:NSASCIIStringEncoding];
    if (!charMapData_) {
      // Unable to convert string to ASCII
      return nil;
    }
    charMap_ = (char *)[charMapData_ bytes];
    NSUInteger length = [charMapData_ length];
    if (length < 2 || length > 128 || length & (length - 1)) {
      // Length not a power of 2 between 2 and 128
      return nil;
    }

    memset(reverseCharMap_, kUnknownChar, sizeof(reverseCharMap_));
    for (unsigned int i = 0; i < length; i++) {
      if (reverseCharMap_[(int)charMap_[i]] != kUnknownChar) {
        // Duplicate character at |i|
        return nil;
      }
      reverseCharMap_[(int)charMap_[i]] = i;
    }

    for (NSUInteger i = 1; i < length; i <<= 1) shift_++;
    mask_ = (1 << shift_) - 1;
    padLen_ = lcm(8, shift_) / shift_;
  }
  return self;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"<Base%d StringEncoder: %@>", 1 << shift_, charMapData_];
}

- (BOOL)doPad {
  return doPad_;
}

- (void)setDoPad:(BOOL)doPad {
  doPad_ = doPad;
}

- (void)setPaddingChar:(char)c {
  paddingChar_ = c;
  reverseCharMap_[(int)c] = kPaddingChar;
}

- (NSString *)encode:(NSData *)inData {
  NSUInteger inLen = [inData length];
  if (inLen <= 0) {
    // Empty input
    return @"";
  }
  unsigned char *inBuf = (unsigned char *)[inData bytes];
  NSUInteger inPos = 0;

  NSUInteger outLen = (inLen * 8 + shift_ - 1) / shift_;
  if (doPad_) {
    outLen = ((outLen + padLen_ - 1) / padLen_) * padLen_;
  }
  NSMutableData *outData = [NSMutableData dataWithLength:outLen];
  unsigned char *outBuf = (unsigned char *)[outData mutableBytes];
  NSUInteger outPos = 0;

  unsigned int buffer = inBuf[inPos++];
  int bitsLeft = 8;
  while (bitsLeft > 0 || inPos < inLen) {
    if (bitsLeft < shift_) {
      if (inPos < inLen) {
        buffer <<= 8;
        buffer |= (inBuf[inPos++] & 0xff);
        bitsLeft += 8;
      } else {
        int pad = shift_ - bitsLeft;
        buffer <<= pad;
        bitsLeft += pad;
      }
    }
    unsigned int idx = (buffer >> (bitsLeft - shift_)) & mask_;
    bitsLeft -= shift_;
    outBuf[outPos++] = charMap_[idx];
  }

  if (doPad_) {
    while (outPos < outLen) outBuf[outPos++] = paddingChar_;
  }

  _FIRInstanceIDDevAssert(outPos == outLen, @"Underflowed output buffer");
  [outData setLength:outPos];

  return [[NSString alloc] initWithData:outData encoding:NSASCIIStringEncoding];
}

- (NSData *)decode:(NSString *)inString {
  char *inBuf = (char *)[inString cStringUsingEncoding:NSASCIIStringEncoding];
  if (!inBuf) {
    // Unable to convert buffer to ASCII
    return nil;
  }
  NSUInteger inLen = strlen(inBuf);

  NSUInteger outLen = inLen * shift_ / 8;
  NSMutableData *outData = [NSMutableData dataWithLength:outLen];
  unsigned char *outBuf = (unsigned char *)[outData mutableBytes];
  NSUInteger outPos = 0;

  int buffer = 0;
  int bitsLeft = 0;
  BOOL expectPad = NO;
  for (NSUInteger i = 0; i < inLen; i++) {
    int val = reverseCharMap_[(int)inBuf[i]];
    switch (val) {
      case kIgnoreChar:
        break;
      case kPaddingChar:
        expectPad = YES;
        break;
      case kUnknownChar:
        // Unexpected data at input pos |i|
        return nil;
      default:
        if (expectPad) {
          // Expected further padding characters
          return nil;
        }
        buffer <<= shift_;
        buffer |= val & mask_;
        bitsLeft += shift_;
        if (bitsLeft >= 8) {
          outBuf[outPos++] = (unsigned char)(buffer >> (bitsLeft - 8));
          bitsLeft -= 8;
        }
        break;
    }
  }

  if (bitsLeft && buffer & ((1 << bitsLeft) - 1)) {
    // Incomplete trailing data
    return nil;
  }

  // Shorten buffer if needed due to padding chars
  _FIRInstanceIDDevAssert(outPos <= outLen, @"Overflowed buffer");
  [outData setLength:outPos];

  return outData;
}

@end
