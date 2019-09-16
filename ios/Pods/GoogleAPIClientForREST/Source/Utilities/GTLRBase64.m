/* Copyright (c) 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !__has_feature(objc_arc)
#error "This file needs to be compiled with ARC enabled."
#endif

#import "GTLRBase64.h"

// Based on Cyrus Najmabadi's elegent little encoder and decoder from
// http://www.cocoadev.com/index.pl?BaseSixtyFour

static char gStandardEncodingTable[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
static char gWebSafeEncodingTable[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

#pragma mark Encode

static NSString *EncodeBase64StringCommon(NSData *data, const char *table) {
  if (data == nil) return nil;

  const uint8_t* input = data.bytes;
  NSUInteger length = data.length;

  NSUInteger bufferSize = ((length + 2) / 3) * 4;
  NSMutableData* buffer = [NSMutableData dataWithLength:bufferSize];

  int8_t *output = buffer.mutableBytes;

  for (NSUInteger i = 0; i < length; i += 3) {
    NSUInteger value = 0;
    for (NSUInteger j = i; j < (i + 3); j++) {
      value <<= 8;

      if (j < length) {
        value |= (0xFF & input[j]);
      }
    }

    NSInteger idx = (i / 3) * 4;
    output[idx + 0] =                    table[(value >> 18) & 0x3F];
    output[idx + 1] =                    table[(value >> 12) & 0x3F];
    output[idx + 2] = (i + 1) < length ? table[(value >> 6)  & 0x3F] : '=';
    output[idx + 3] = (i + 2) < length ? table[(value >> 0)  & 0x3F] : '=';
  }

  NSString *result = [[NSString alloc] initWithData:buffer
                                           encoding:NSASCIIStringEncoding];
  return result;
}

NSString *GTLREncodeBase64(NSData *data) {
  return EncodeBase64StringCommon(data, gStandardEncodingTable);
}

NSString *GTLREncodeWebSafeBase64(NSData *data) {
  return EncodeBase64StringCommon(data, gWebSafeEncodingTable);
}

#pragma mark Decode

static void CreateDecodingTable(const char *encodingTable,
                                size_t encodingTableSize, char *decodingTable) {
  memset(decodingTable, 0, 128);
  for (unsigned int i = 0; i < encodingTableSize; i++) {
    decodingTable[(unsigned int) encodingTable[i]] = (char)i;
  }
}

static NSData *DecodeBase64StringCommon(NSString *base64Str,
                                        char *decodingTable,
                                        BOOL requirePadding) {
  // The input string should be plain ASCII
  const char *cString = [base64Str cStringUsingEncoding:NSASCIIStringEncoding];
  if (cString == nil) return nil;

  NSInteger inputLength = (NSInteger)strlen(cString);
  if (requirePadding && (inputLength % 4 != 0)) return nil;
  if (inputLength == 0) return [NSData data];

  while (inputLength > 0 && cString[inputLength - 1] == '=') {
    inputLength--;
  }

  NSInteger outputLength = inputLength * 3 / 4;
  NSMutableData* data = [NSMutableData dataWithLength:(NSUInteger)outputLength];
  uint8_t *output = data.mutableBytes;

  NSInteger inputPoint = 0;
  NSInteger outputPoint = 0;
  char *table = decodingTable;

  while (inputPoint < inputLength) {
    int i0 = cString[inputPoint++];
    int i1 = cString[inputPoint++];
    int i2 = inputPoint < inputLength ? cString[inputPoint++] : 'A'; // 'A' will decode to \0
    int i3 = inputPoint < inputLength ? cString[inputPoint++] : 'A';

    output[outputPoint++] = (uint8_t)((table[i0] << 2) | (table[i1] >> 4));
    if (outputPoint < outputLength) {
      output[outputPoint++] = (uint8_t)(((table[i1] & 0xF) << 4) | (table[i2] >> 2));
    }
    if (outputPoint < outputLength) {
      output[outputPoint++] = (uint8_t)(((table[i2] & 0x3) << 6) | table[i3]);
    }
  }

  return data;
}

NSData *GTLRDecodeBase64(NSString *base64Str) {
  static char decodingTable[128];
  static BOOL hasInited = NO;

  if (!hasInited) {
    CreateDecodingTable(gStandardEncodingTable, sizeof(gStandardEncodingTable),
                        decodingTable);
    hasInited = YES;
  }
  return DecodeBase64StringCommon(base64Str, decodingTable, YES /* requirePadding */ );
}

NSData *GTLRDecodeWebSafeBase64(NSString *base64Str) {
  static char decodingTable[128];
  static BOOL hasInited = NO;

  if (!hasInited) {
    CreateDecodingTable(gWebSafeEncodingTable, sizeof(gWebSafeEncodingTable),
                        decodingTable);
    hasInited = YES;
  }
  return DecodeBase64StringCommon(base64Str, decodingTable, NO /* requirePadding */);
}
