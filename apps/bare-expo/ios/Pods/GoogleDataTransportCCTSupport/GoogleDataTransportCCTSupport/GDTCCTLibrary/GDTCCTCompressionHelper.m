/*
 * Copyright 2020 Google
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

#import "GDTCCTLibrary/Private/GDTCCTCompressionHelper.h"

#import <zlib.h>

@implementation GDTCCTCompressionHelper

+ (nullable NSData *)gzippedData:(NSData *)data {
#if defined(__LP64__) && __LP64__
  // Don't support > 32bit length for 64 bit, see note in header.
  if (data.length > UINT_MAX) {
    return nil;
  }
#endif

  const uint kChunkSize = 1024;

  const void *bytes = [data bytes];
  NSUInteger length = [data length];

  int level = Z_DEFAULT_COMPRESSION;
  if (!bytes || !length) {
    return nil;
  }

  z_stream strm;
  bzero(&strm, sizeof(z_stream));

  int memLevel = 8;          // Default.
  int windowBits = 15 + 16;  // Enable gzip header instead of zlib header.

  int retCode;
  if (deflateInit2(&strm, level, Z_DEFLATED, windowBits, memLevel, Z_DEFAULT_STRATEGY) != Z_OK) {
    return nil;
  }

  // Hint the size at 1/4 the input size.
  NSMutableData *result = [NSMutableData dataWithCapacity:(length / 4)];
  unsigned char output[kChunkSize];

  // Setup the input.
  strm.avail_in = (unsigned int)length;
  strm.next_in = (unsigned char *)bytes;

  // Collect the data.
  do {
    // update what we're passing in
    strm.avail_out = kChunkSize;
    strm.next_out = output;
    retCode = deflate(&strm, Z_FINISH);
    if ((retCode != Z_OK) && (retCode != Z_STREAM_END)) {
      deflateEnd(&strm);
      return nil;
    }
    // Collect what we got.
    unsigned gotBack = kChunkSize - strm.avail_out;
    if (gotBack > 0) {
      [result appendBytes:output length:gotBack];
    }

  } while (retCode == Z_OK);

  // If the loop exits, it used all input and the stream ended.
  NSAssert(strm.avail_in == 0,
           @"Should have finished deflating without using all input, %u bytes left", strm.avail_in);
  NSAssert(retCode == Z_STREAM_END,
           @"thought we finished deflate w/o getting a result of stream end, code %d", retCode);

  // Clean up.
  deflateEnd(&strm);

  return result;
}

+ (BOOL)isGzipped:(NSData *)data {
  const UInt8 *bytes = (const UInt8 *)data.bytes;
  return (data.length >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b);
}

@end
