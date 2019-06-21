//
//  GTMNSData+zlib.h
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

#import <Foundation/Foundation.h>
#import "GTMDefines.h"

/// Helpers for dealing w/ zlib inflate/deflate calls.
@interface NSData (GTMZLibAdditions)

// NOTE: For 64bit, none of these apis handle input sizes >32bits, they will
// return nil when given such data.  To handle data of that size you really
// should be streaming it rather then doing it all in memory.

#pragma mark Gzip Compression

/// Return an autoreleased NSData w/ the result of gzipping the bytes.
//
//  Uses the default compression level.
+ (NSData *)gtm_dataByGzippingBytes:(const void *)bytes
                             length:(NSUInteger)length __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByGzippingBytes:(const void *)bytes
                             length:(NSUInteger)length
                              error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of gzipping the payload of |data|.
//
//  Uses the default compression level.
+ (NSData *)gtm_dataByGzippingData:(NSData *)data __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByGzippingData:(NSData *)data
                             error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of gzipping the bytes using |level| compression level.
//
// |level| can be 1-9, any other values will be clipped to that range.
+ (NSData *)gtm_dataByGzippingBytes:(const void *)bytes
                             length:(NSUInteger)length
                   compressionLevel:(int)level __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByGzippingBytes:(const void *)bytes
                             length:(NSUInteger)length
                   compressionLevel:(int)level
                              error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of gzipping the payload of |data| using |level| compression level.
+ (NSData *)gtm_dataByGzippingData:(NSData *)data
                  compressionLevel:(int)level __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByGzippingData:(NSData *)data
                  compressionLevel:(int)level
                             error:(NSError **)error;

#pragma mark Zlib "Stream" Compression

// NOTE: deflate is *NOT* gzip.  deflate is a "zlib" stream.  pick which one
// you really want to create.  (the inflate api will handle either)

/// Return an autoreleased NSData w/ the result of deflating the bytes.
//
//  Uses the default compression level.
+ (NSData *)gtm_dataByDeflatingBytes:(const void *)bytes
                              length:(NSUInteger)length __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByDeflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                               error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of deflating the payload of |data|.
//
//  Uses the default compression level.
+ (NSData *)gtm_dataByDeflatingData:(NSData *)data __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByDeflatingData:(NSData *)data
                              error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of deflating the bytes using |level| compression level.
//
// |level| can be 1-9, any other values will be clipped to that range.
+ (NSData *)gtm_dataByDeflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                    compressionLevel:(int)level __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByDeflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                    compressionLevel:(int)level
                               error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of deflating the payload of |data| using |level| compression level.
+ (NSData *)gtm_dataByDeflatingData:(NSData *)data
                   compressionLevel:(int)level __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByDeflatingData:(NSData *)data
                   compressionLevel:(int)level
                              error:(NSError **)error;

#pragma mark Uncompress of Gzip or Zlib

/// Return an autoreleased NSData w/ the result of decompressing the bytes.
//
// The bytes to decompress can be zlib or gzip payloads.
+ (NSData *)gtm_dataByInflatingBytes:(const void *)bytes
                              length:(NSUInteger)length __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByInflatingBytes:(const void *)bytes
                              length:(NSUInteger)length
                               error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of decompressing the payload of |data|.
//
// The data to decompress can be zlib or gzip payloads.
+ (NSData *)gtm_dataByInflatingData:(NSData *)data __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByInflatingData:(NSData *)data
                              error:(NSError **)error;

#pragma mark "Raw" Compression Support

// NOTE: raw deflate is *NOT* gzip or deflate.  it does not include a header
// of any form and should only be used within streams here an external crc/etc.
// is done to validate the data.  The RawInflate apis can be used on data
// processed like this.

/// Return an autoreleased NSData w/ the result of *raw* deflating the bytes.
//
//  Uses the default compression level.
//  *No* header is added to the resulting data.
+ (NSData *)gtm_dataByRawDeflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByRawDeflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length
                                  error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of *raw* deflating the payload of |data|.
//
//  Uses the default compression level.
//  *No* header is added to the resulting data.
+ (NSData *)gtm_dataByRawDeflatingData:(NSData *)data __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByRawDeflatingData:(NSData *)data
                                 error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of *raw* deflating the bytes using |level| compression level.
//
// |level| can be 1-9, any other values will be clipped to that range.
//  *No* header is added to the resulting data.
+ (NSData *)gtm_dataByRawDeflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length
                       compressionLevel:(int)level __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByRawDeflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length
                       compressionLevel:(int)level
                                  error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of *raw* deflating the payload of |data| using |level| compression level.
//  *No* header is added to the resulting data.
+ (NSData *)gtm_dataByRawDeflatingData:(NSData *)data
                      compressionLevel:(int)level __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByRawDeflatingData:(NSData *)data
                      compressionLevel:(int)level
                                 error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of *raw* decompressing the bytes.
//
// The data to decompress, it should *not* have any header (zlib nor gzip).
+ (NSData *)gtm_dataByRawInflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByRawInflatingBytes:(const void *)bytes
                                 length:(NSUInteger)length
                                  error:(NSError **)error;

/// Return an autoreleased NSData w/ the result of *raw* decompressing the payload of |data|.
//
// The data to decompress, it should *not* have any header (zlib nor gzip).
+ (NSData *)gtm_dataByRawInflatingData:(NSData *)data __attribute__((deprecated("Use error variant")));
+ (NSData *)gtm_dataByRawInflatingData:(NSData *)data
                                 error:(NSError **)error;

@end

FOUNDATION_EXPORT NSString *const GTMNSDataZlibErrorDomain;
FOUNDATION_EXPORT NSString *const GTMNSDataZlibErrorKey;  // NSNumber
FOUNDATION_EXPORT NSString *const GTMNSDataZlibRemainingBytesKey;  // NSNumber

typedef NS_ENUM(NSInteger, GTMNSDataZlibError) {
  GTMNSDataZlibErrorGreaterThan32BitsToCompress = 1024,
  // An internal zlib error.
  // GTMNSDataZlibErrorKey will contain the error value.
  // NSLocalizedDescriptionKey may contain an error string from zlib.
  // Look in zlib.h for list of errors.
  GTMNSDataZlibErrorInternal,
  // There was left over data in the buffer that was not used.
  // GTMNSDataZlibRemainingBytesKey will contain number of remaining bytes.
  GTMNSDataZlibErrorDataRemaining
};
