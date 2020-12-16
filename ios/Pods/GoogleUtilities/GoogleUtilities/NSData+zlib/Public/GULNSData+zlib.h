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

#import <Foundation/Foundation.h>

/// This is a copy of Google Toolbox for Mac library to avoid creating an extra framework.

// NOTE: For 64bit, none of these apis handle input sizes >32bits, they will return nil when given
// such data. To handle data of that size you really should be streaming it rather then doing it all
// in memory.

@interface NSData (GULGzip)

/// Returns an data as the result of decompressing the payload of |data|.The data to decompress must
/// be a gzipped payloads.
+ (NSData *)gul_dataByInflatingGzippedData:(NSData *)data error:(NSError **)error;

/// Returns an compressed data with the result of gzipping the payload of |data|. Uses the default
/// compression level.
+ (NSData *)gul_dataByGzippingData:(NSData *)data error:(NSError **)error;

FOUNDATION_EXPORT NSString *const GULNSDataZlibErrorDomain;
FOUNDATION_EXPORT NSString *const GULNSDataZlibErrorKey;           // NSNumber
FOUNDATION_EXPORT NSString *const GULNSDataZlibRemainingBytesKey;  // NSNumber

typedef NS_ENUM(NSInteger, GULNSDataZlibError) {
  GULNSDataZlibErrorGreaterThan32BitsToCompress = 1024,
  // An internal zlib error.
  // GULNSDataZlibErrorKey will contain the error value.
  // NSLocalizedDescriptionKey may contain an error string from zlib.
  // Look in zlib.h for list of errors.
  GULNSDataZlibErrorInternal,
  // There was left over data in the buffer that was not used.
  // GULNSDataZlibRemainingBytesKey will contain number of remaining bytes.
  GULNSDataZlibErrorDataRemaining
};

@end
