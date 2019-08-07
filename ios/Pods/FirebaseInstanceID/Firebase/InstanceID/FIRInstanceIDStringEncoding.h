//
//  GTMStringEncoding.h
//
//  Copyright 2010 Google Inc.
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

#import <Foundation/Foundation.h>

// A generic class for arbitrary base-2 to 128 string encoding and decoding.
@interface FIRInstanceIDStringEncoding : NSObject {
 @private
  NSData *charMapData_;
  char *charMap_;
  int reverseCharMap_[128];
  int shift_;
  unsigned int mask_;
  BOOL doPad_;
  char paddingChar_;
  int padLen_;
}

+ (id)rfc4648Base64WebsafeStringEncoding;

// Create a new, autoreleased GTMStringEncoding object with the given string,
// as described below.
+ (id)stringEncodingWithString:(NSString *)string;

// Initialize a new GTMStringEncoding object with the string.
//
// The length of the string must be a power of 2, at least 2 and at most 128.
// Only 7-bit ASCII characters are permitted in the string.
//
// These characters are the canonical set emitted during encoding.
// If the characters have alternatives (e.g. case, easily transposed) then use
// addDecodeSynonyms: to configure them.
- (id)initWithString:(NSString *)string;

// Indicates whether padding is performed during encoding.
- (BOOL)doPad;
- (void)setDoPad:(BOOL)doPad;

// Sets the padding character to use during encoding.
- (void)setPaddingChar:(char)c;

// Encode a raw binary buffer to a 7-bit ASCII string.
- (NSString *)encode:(NSData *)data;

// Decode a 7-bit ASCII string to a raw binary buffer.
- (NSData *)decode:(NSString *)string;

@end
