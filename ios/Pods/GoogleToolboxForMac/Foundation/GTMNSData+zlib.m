//
//  GTMNSData+zlib.m
//
//  Copyright 2007-2008 Google Inc.
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

#import "GTMNSData+zlib.h"
#import <zlib.h>
#import "GTMDefines.h"

#define kChunkSize 1024

NSString *const GTMNSDataZlibErrorDomain = @"com.google.GTMNSDataZlibErrorDomain";
NSString *const GTMNSDataZlibErrorKey = @"GTMNSDataZlibErrorKey";
NSString *const GTMNSDataZlibRemainingBytesKey = @"GTMNSDataZlibRemainingBytesKey";

typedef enum {
  CompressionModeZlib,
  CompressionModeGzip,
  CompressionModeRaw,
} CompressionMode;

@interface NSData (GTMZlibAdditionsPrivate)
+ (NSData *)gtm_dataByCompressingBytes:(const void *)bytes
                                length:(NSUInteger)length
                      compressionLevel:(int)level
                                  mode:(CompressionMode)mode
                                 error:(NSError **)error;
+ (NSData *)gtm_dataByInflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                           isRawData:(BOOL)isRawData
                               error:(NSError **)error;
@end

@implementation NSData (GTMZlibAdditionsPrivate)

+ (NSData *)gtm_dataByCompressingBytes:(const void *)bytes
                                length:(NSUInteger)length
                      compressionLevel:(int)level
                                  mode:(CompressionMode)mode
                                 error:(NSError **)error {
  if (!bytes || !length) {
    return nil;
  }

#if defined(__LP64__) && __LP64__
  // Don't support > 32bit length for 64 bit, see note in header.
  if (length > UINT_MAX) {
    if (error) {
      *error = [NSError errorWithDomain:GTMNSDataZlibErrorDomain
                                   code:GTMNSDataZlibErrorGreaterThan32BitsToCompress
                               userInfo:nil];
    }
    return nil;
  }
#endif

  if (level == Z_DEFAULT_COMPRESSION) {
    // the default value is actually outside the range, so we have to let it
    // through specifically.
  } else if (level < Z_BEST_SPEED) {
    level = Z_BEST_SPEED;
  } else if (level > Z_BEST_COMPRESSION) {
    level = Z_BEST_COMPRESSION;
  }

  z_stream strm;
  bzero(&strm, sizeof(z_stream));

  int memLevel = 8; // the default
  int windowBits = 15; // the default
  switch (mode) {
    case CompressionModeZlib:
      // nothing to do
      break;

    case CompressionModeGzip:
      windowBits += 16; // enable gzip header instead of zlib header
      break;

    case CompressionModeRaw:
      windowBits *= -1; // Negative to mean no header.
      break;
  }
  int retCode;
  if ((retCode = deflateInit2(&strm, level, Z_DEFLATED, windowBits,
                              memLevel, Z_DEFAULT_STRATEGY)) != Z_OK) {
    // COV_NF_START - no real way to force this in a unittest (we guard all args)
    if (error) {
      NSDictionary *userInfo = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:retCode]
                                                           forKey:GTMNSDataZlibErrorKey];
      *error = [NSError errorWithDomain:GTMNSDataZlibErrorDomain
                                   code:GTMNSDataZlibErrorInternal
                               userInfo:userInfo];
    }
    return nil;
    // COV_NF_END
  }

  // hint the size at 1/4 the input size
  NSMutableData *result = [NSMutableData dataWithCapacity:(length/4)];
  unsigned char output[kChunkSize];

  // setup the input
  strm.avail_in = (unsigned int)length;
  strm.next_in = (unsigned char*)bytes;

  // loop to collect the data
  do {
    // update what we're passing in
    strm.avail_out = kChunkSize;
    strm.next_out = output;
    retCode = deflate(&strm, Z_FINISH);
    if ((retCode != Z_OK) && (retCode != Z_STREAM_END)) {
      // COV_NF_START - no real way to force this in a unittest
      // (in inflate, we can feed bogus/truncated data to test, but an error
      // here would be some internal issue w/in zlib, and there isn't any real
      // way to test it)
      if (error) {
        NSDictionary *userInfo = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:retCode]
                                                             forKey:GTMNSDataZlibErrorKey];
        *error = [NSError errorWithDomain:GTMNSDataZlibErrorDomain
                                     code:GTMNSDataZlibErrorInternal
                                 userInfo:userInfo];
      }
      deflateEnd(&strm);
      return nil;
      // COV_NF_END
    }
    // collect what we got
    unsigned gotBack = kChunkSize - strm.avail_out;
    if (gotBack > 0) {
      [result appendBytes:output length:gotBack];
    }

  } while (retCode == Z_OK);

  // if the loop exits, we used all input and the stream ended
  _GTMDevAssert(strm.avail_in == 0,
                @"thought we finished deflate w/o using all input, %u bytes left",
                strm.avail_in);
  _GTMDevAssert(retCode == Z_STREAM_END,
                @"thought we finished deflate w/o getting a result of stream end, code %d",
                retCode);

  // clean up
  deflateEnd(&strm);

  return result;
} // gtm_dataByCompressingBytes:length:compressionLevel:useGzip:

+ (NSData *)gtm_dataByInflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                           isRawData:(BOOL)isRawData
                               error:(NSError **)error {
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

  // setup the input
  strm.avail_in = (unsigned int)length;
  strm.next_in = (unsigned char*)bytes;

  int windowBits = 15; // 15 to enable any window size
  if (isRawData) {
    windowBits *= -1; // make it negative to signal no header.
  } else {
    windowBits += 32; // and +32 to enable zlib or gzip header detection.
  }

  int retCode;
  if ((retCode = inflateInit2(&strm, windowBits)) != Z_OK) {
    // COV_NF_START - no real way to force this in a unittest (we guard all args)
    if (error) {
      NSDictionary *userInfo = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:retCode]
                                                           forKey:GTMNSDataZlibErrorKey];
      *error = [NSError errorWithDomain:GTMNSDataZlibErrorDomain
                                   code:GTMNSDataZlibErrorInternal
                               userInfo:userInfo];
    }
    return nil;
    // COV_NF_END
  }

  // hint the size at 4x the input size
  NSMutableData *result = [NSMutableData dataWithCapacity:(length*4)];
  unsigned char output[kChunkSize];

  // loop to collect the data
  do {
    // update what we're passing in
    strm.avail_out = kChunkSize;
    strm.next_out = output;
    retCode = inflate(&strm, Z_NO_FLUSH);
    if ((retCode != Z_OK) && (retCode != Z_STREAM_END)) {
      if (error) {
        NSMutableDictionary *userInfo =
            [NSMutableDictionary dictionaryWithObject:[NSNumber numberWithInt:retCode]
                                               forKey:GTMNSDataZlibErrorKey];
        if (strm.msg) {
          NSString *message = [NSString stringWithUTF8String:strm.msg];
          if (message) {
            [userInfo setObject:message forKey:NSLocalizedDescriptionKey];
          }
        }
        *error = [NSError errorWithDomain:GTMNSDataZlibErrorDomain
                                     code:GTMNSDataZlibErrorInternal
                                 userInfo:userInfo];
      }
      inflateEnd(&strm);
      return nil;
    }
    // collect what we got
    unsigned gotBack = kChunkSize - strm.avail_out;
    if (gotBack > 0) {
      [result appendBytes:output length:gotBack];
    }

  } while (retCode == Z_OK);

  // make sure there wasn't more data tacked onto the end of a valid compressed
  // stream.
  if (strm.avail_in != 0) {
    if (error) {
      NSDictionary *userInfo =
          [NSDictionary dictionaryWithObject:[NSNumber numberWithUnsignedInt:strm.avail_in]
                                      forKey:GTMNSDataZlibRemainingBytesKey];
      *error = [NSError errorWithDomain:GTMNSDataZlibErrorDomain
                                   code:GTMNSDataZlibErrorDataRemaining
                               userInfo:userInfo];
    }
    result = nil;
  }
  // the only way out of the loop was by hitting the end of the stream
  _GTMDevAssert(retCode == Z_STREAM_END,
                @"thought we finished inflate w/o getting a result of stream end, code %d",
                retCode);

  // clean up
  inflateEnd(&strm);

  return result;
} // gtm_dataByInflatingBytes:length:windowBits:

@end


@implementation NSData (GTMZLibAdditions)

+ (NSData *)gtm_dataByGzippingBytes:(const void *)bytes
                             length:(NSUInteger)length {
  return [self gtm_dataByGzippingBytes:bytes length:length error:NULL];
} // gtm_dataByGzippingBytes:length:

+ (NSData *)gtm_dataByGzippingBytes:(const void *)bytes
                             length:(NSUInteger)length
                              error:(NSError **)error {
  return [self gtm_dataByCompressingBytes:bytes
                                   length:length
                         compressionLevel:Z_DEFAULT_COMPRESSION
                                     mode:CompressionModeGzip
                                    error:error];
} // gtm_dataByGzippingBytes:length:error:

+ (NSData *)gtm_dataByGzippingData:(NSData *)data {
  return [self gtm_dataByGzippingData:data error:NULL];
} // gtm_dataByGzippingData:

+ (NSData *)gtm_dataByGzippingData:(NSData *)data error:(NSError **)error {
  return [self gtm_dataByCompressingBytes:[data bytes]
                                   length:[data length]
                         compressionLevel:Z_DEFAULT_COMPRESSION
                                     mode:CompressionModeGzip
                                    error:error];
} // gtm_dataByGzippingData:error:

+ (NSData *)gtm_dataByGzippingBytes:(const void *)bytes
                             length:(NSUInteger)length
                   compressionLevel:(int)level {
  return [self gtm_dataByGzippingBytes:bytes
                                length:length
                      compressionLevel:level
                                 error:NULL];
} // gtm_dataByGzippingBytes:length:level:

+ (NSData *)gtm_dataByGzippingBytes:(const void *)bytes
                             length:(NSUInteger)length
                   compressionLevel:(int)level
                              error:(NSError **)error{
  return [self gtm_dataByCompressingBytes:bytes
                                   length:length
                         compressionLevel:level
                                     mode:CompressionModeGzip
                                    error:error];
} // gtm_dataByGzippingBytes:length:level:error

+ (NSData *)gtm_dataByGzippingData:(NSData *)data
                  compressionLevel:(int)level {
  return [self gtm_dataByGzippingData:data
                     compressionLevel:level
                                error:NULL];
} // gtm_dataByGzippingData:level:

+ (NSData *)gtm_dataByGzippingData:(NSData *)data
                  compressionLevel:(int)level
                             error:(NSError **)error{
  return [self gtm_dataByCompressingBytes:[data bytes]
                                   length:[data length]
                         compressionLevel:level
                                     mode:CompressionModeGzip
                                    error:error];
} // gtm_dataByGzippingData:level:error

#pragma mark -

+ (NSData *)gtm_dataByDeflatingBytes:(const void *)bytes
                              length:(NSUInteger)length {
  return [self gtm_dataByDeflatingBytes:bytes
                                 length:length
                                  error:NULL];
} // gtm_dataByDeflatingBytes:length:

+ (NSData *)gtm_dataByDeflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                               error:(NSError **)error{
  return [self gtm_dataByCompressingBytes:bytes
                                   length:length
                         compressionLevel:Z_DEFAULT_COMPRESSION
                                     mode:CompressionModeZlib
                                    error:error];
} // gtm_dataByDeflatingBytes:length:error

+ (NSData *)gtm_dataByDeflatingData:(NSData *)data {
  return [self gtm_dataByDeflatingData:data error:NULL];
} // gtm_dataByDeflatingData:

+ (NSData *)gtm_dataByDeflatingData:(NSData *)data error:(NSError **)error {
  return [self gtm_dataByCompressingBytes:[data bytes]
                                   length:[data length]
                         compressionLevel:Z_DEFAULT_COMPRESSION
                                     mode:CompressionModeZlib
                                    error:error];
} // gtm_dataByDeflatingData:

+ (NSData *)gtm_dataByDeflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                    compressionLevel:(int)level {
  return [self gtm_dataByDeflatingBytes:bytes
                                 length:length
                       compressionLevel:level
                                  error:NULL];
} // gtm_dataByDeflatingBytes:length:level:

+ (NSData *)gtm_dataByDeflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                    compressionLevel:(int)level
                               error:(NSError **)error {
  return [self gtm_dataByCompressingBytes:bytes
                                   length:length
                         compressionLevel:level
                                     mode:CompressionModeZlib
                                    error:error];
} // gtm_dataByDeflatingBytes:length:level:error:

+ (NSData *)gtm_dataByDeflatingData:(NSData *)data
                   compressionLevel:(int)level {
  return [self gtm_dataByDeflatingData:data
                      compressionLevel:level
                                 error:NULL];
} // gtm_dataByDeflatingData:level:

+ (NSData *)gtm_dataByDeflatingData:(NSData *)data
                   compressionLevel:(int)level
                              error:(NSError **)error {
  return [self gtm_dataByCompressingBytes:[data bytes]
                                   length:[data length]
                         compressionLevel:level
                                     mode:CompressionModeZlib
                                    error:error];
} // gtm_dataByDeflatingData:level:error:

#pragma mark -

+ (NSData *)gtm_dataByInflatingBytes:(const void *)bytes
                              length:(NSUInteger)length {
  return [self gtm_dataByInflatingBytes:bytes
                                 length:length
                                  error:NULL];
} // gtm_dataByInflatingBytes:length:

+ (NSData *)gtm_dataByInflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                               error:(NSError **)error {
  return [self gtm_dataByInflatingBytes:bytes
                                 length:length
                              isRawData:NO
                                  error:error];
} // gtm_dataByInflatingBytes:length:error:

+ (NSData *)gtm_dataByInflatingData:(NSData *)data {
  return [self gtm_dataByInflatingData:data error:NULL];
} // gtm_dataByInflatingData:

+ (NSData *)gtm_dataByInflatingData:(NSData *)data
                              error:(NSError **)error {
  return [self gtm_dataByInflatingBytes:[data bytes]
                                 length:[data length]
                              isRawData:NO
                                  error:error];
} // gtm_dataByInflatingData:

#pragma mark -

+ (NSData *)gtm_dataByRawDeflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length {
  return [self gtm_dataByRawDeflatingBytes:(const void *)bytes
                                    length:(NSUInteger)length
                                     error:NULL];
} // gtm_dataByRawDeflatingBytes:length:

+ (NSData *)gtm_dataByRawDeflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length
                                  error:(NSError **)error {
  return [self gtm_dataByCompressingBytes:bytes
                                   length:length
                         compressionLevel:Z_DEFAULT_COMPRESSION
                                     mode:CompressionModeRaw
                                    error:error];
} // gtm_dataByRawDeflatingBytes:length:error:

+ (NSData *)gtm_dataByRawDeflatingData:(NSData *)data {
  return [self gtm_dataByRawDeflatingData:data error:NULL];
} // gtm_dataByRawDeflatingData:

+ (NSData *)gtm_dataByRawDeflatingData:(NSData *)data error:(NSError **)error {
  return [self gtm_dataByCompressingBytes:[data bytes]
                                   length:[data length]
                         compressionLevel:Z_DEFAULT_COMPRESSION
                                     mode:CompressionModeRaw
                                    error:error];
} // gtm_dataByRawDeflatingData:error:

+ (NSData *)gtm_dataByRawDeflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length
                       compressionLevel:(int)level {
  return [self gtm_dataByRawDeflatingBytes:bytes
                                    length:length
                          compressionLevel:level
                                     error:NULL];
} // gtm_dataByRawDeflatingBytes:length:compressionLevel:

+ (NSData *)gtm_dataByRawDeflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length
                       compressionLevel:(int)level
                                  error:(NSError **)error{
  return [self gtm_dataByCompressingBytes:bytes
                                   length:length
                         compressionLevel:level
                                     mode:CompressionModeRaw
                                    error:error];
} // gtm_dataByRawDeflatingBytes:length:compressionLevel:error:

+ (NSData *)gtm_dataByRawDeflatingData:(NSData *)data
                      compressionLevel:(int)level {
  return [self gtm_dataByRawDeflatingData:data
                         compressionLevel:level
                                    error:NULL];
} // gtm_dataByRawDeflatingData:compressionLevel:

+ (NSData *)gtm_dataByRawDeflatingData:(NSData *)data
                      compressionLevel:(int)level
                                 error:(NSError **)error {
  return [self gtm_dataByCompressingBytes:[data bytes]
                                   length:[data length]
                         compressionLevel:level
                                     mode:CompressionModeRaw
                                    error:error];
} // gtm_dataByRawDeflatingData:compressionLevel:error:

+ (NSData *)gtm_dataByRawInflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length {
  return [self gtm_dataByInflatingBytes:bytes
                                 length:length
                                  error:NULL];
} // gtm_dataByRawInflatingBytes:length:

+ (NSData *)gtm_dataByRawInflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length
                                  error:(NSError **)error{
  return [self gtm_dataByInflatingBytes:bytes
                                 length:length
                              isRawData:YES
                                  error:error];
} // gtm_dataByRawInflatingBytes:length:error:

+ (NSData *)gtm_dataByRawInflatingData:(NSData *)data {
  return [self gtm_dataByRawInflatingData:data
                                    error:NULL];
} // gtm_dataByRawInflatingData:

+ (NSData *)gtm_dataByRawInflatingData:(NSData *)data
                                 error:(NSError **)error {
  return [self gtm_dataByInflatingBytes:[data bytes]
                                 length:[data length]
                              isRawData:YES
                                  error:error];
} // gtm_dataByRawInflatingData:error:

@end
