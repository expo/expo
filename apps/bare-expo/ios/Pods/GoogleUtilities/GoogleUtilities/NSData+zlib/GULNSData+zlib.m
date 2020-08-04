// Copyright 2018 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "GoogleUtilities/NSData+zlib/GULNSData+zlib.h"

#import <zlib.h>

#define kChunkSize 1024
#define Z_DEFAULT_COMPRESSION (-1)

NSString *const GULNSDataZlibErrorDomain = @"com.google.GULNSDataZlibErrorDomain";
NSString *const GULNSDataZlibErrorKey = @"GULNSDataZlibErrorKey";
NSString *const GULNSDataZlibRemainingBytesKey = @"GULNSDataZlibRemainingBytesKey";

@implementation NSData (GULGzip)

+ (NSData *)gul_dataByInflatingGzippedData:(NSData *)data error:(NSError **)error {
  const void *bytes = [data bytes];
  NSUInteger length = [data length];
  if (!bytes || !length) {
    return nil;
  }

#if defined(__LP64__) && __LP64__
  // Don't support > 32bit length for 64 bit, see note in header.
  if (length > UINT_MAX) {
    return nil;
  }
#endif

  z_stream strm;
  bzero(&strm, sizeof(z_stream));

  // Setup the input.
  strm.avail_in = (unsigned int)length;
  strm.next_in = (unsigned char *)bytes;

  int windowBits = 15;  // 15 to enable any window size
  windowBits += 32;     // and +32 to enable zlib or gzip header detection.

  int retCode;
  if ((retCode = inflateInit2(&strm, windowBits)) != Z_OK) {
    if (error) {
      NSDictionary *userInfo = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:retCode]
                                                           forKey:GULNSDataZlibErrorKey];
      *error = [NSError errorWithDomain:GULNSDataZlibErrorDomain
                                   code:GULNSDataZlibErrorInternal
                               userInfo:userInfo];
    }
    return nil;
  }

  // Hint the size at 4x the input size.
  NSMutableData *result = [NSMutableData dataWithCapacity:(length * 4)];
  unsigned char output[kChunkSize];

  // Loop to collect the data.
  do {
    // Update what we're passing in.
    strm.avail_out = kChunkSize;
    strm.next_out = output;
    retCode = inflate(&strm, Z_NO_FLUSH);
    if ((retCode != Z_OK) && (retCode != Z_STREAM_END)) {
      if (error) {
        NSMutableDictionary *userInfo =
            [NSMutableDictionary dictionaryWithObject:[NSNumber numberWithInt:retCode]
                                               forKey:GULNSDataZlibErrorKey];
        if (strm.msg) {
          NSString *message = [NSString stringWithUTF8String:strm.msg];
          if (message) {
            [userInfo setObject:message forKey:NSLocalizedDescriptionKey];
          }
        }
        *error = [NSError errorWithDomain:GULNSDataZlibErrorDomain
                                     code:GULNSDataZlibErrorInternal
                                 userInfo:userInfo];
      }
      inflateEnd(&strm);
      return nil;
    }
    // Collect what we got.
    unsigned gotBack = kChunkSize - strm.avail_out;
    if (gotBack > 0) {
      [result appendBytes:output length:gotBack];
    }

  } while (retCode == Z_OK);

  // Make sure there wasn't more data tacked onto the end of a valid compressed stream.
  if (strm.avail_in != 0) {
    if (error) {
      NSDictionary *userInfo =
          [NSDictionary dictionaryWithObject:[NSNumber numberWithUnsignedInt:strm.avail_in]
                                      forKey:GULNSDataZlibRemainingBytesKey];
      *error = [NSError errorWithDomain:GULNSDataZlibErrorDomain
                                   code:GULNSDataZlibErrorDataRemaining
                               userInfo:userInfo];
    }
    result = nil;
  }
  // The only way out of the loop was by hitting the end of the stream.
  NSAssert(retCode == Z_STREAM_END,
           @"Thought we finished inflate w/o getting a result of stream end, code %d", retCode);

  // Clean up.
  inflateEnd(&strm);

  return result;
}

+ (NSData *)gul_dataByGzippingData:(NSData *)data error:(NSError **)error {
  const void *bytes = [data bytes];
  NSUInteger length = [data length];

  int level = Z_DEFAULT_COMPRESSION;
  if (!bytes || !length) {
    return nil;
  }

#if defined(__LP64__) && __LP64__
  // Don't support > 32bit length for 64 bit, see note in header.
  if (length > UINT_MAX) {
    if (error) {
      *error = [NSError errorWithDomain:GULNSDataZlibErrorDomain
                                   code:GULNSDataZlibErrorGreaterThan32BitsToCompress
                               userInfo:nil];
    }
    return nil;
  }
#endif

  z_stream strm;
  bzero(&strm, sizeof(z_stream));

  int memLevel = 8;          // Default.
  int windowBits = 15 + 16;  // Enable gzip header instead of zlib header.

  int retCode;
  if ((retCode = deflateInit2(&strm, level, Z_DEFLATED, windowBits, memLevel,
                              Z_DEFAULT_STRATEGY)) != Z_OK) {
    if (error) {
      NSDictionary *userInfo = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:retCode]
                                                           forKey:GULNSDataZlibErrorKey];
      *error = [NSError errorWithDomain:GULNSDataZlibErrorDomain
                                   code:GULNSDataZlibErrorInternal
                               userInfo:userInfo];
    }
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
      if (error) {
        NSDictionary *userInfo = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:retCode]
                                                             forKey:GULNSDataZlibErrorKey];
        *error = [NSError errorWithDomain:GULNSDataZlibErrorDomain
                                     code:GULNSDataZlibErrorInternal
                                 userInfo:userInfo];
      }
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

@end
