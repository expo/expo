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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** A class with methods to help with gzipped data. */
@interface GDTCCTCompressionHelper : NSObject

/** Compresses the given data and returns a new data object.
 *
 * @note Reduced version from GULNSData+zlib.m of GoogleUtilities.
 * @return Compressed data, or nil if there was an error.
 */
+ (nullable NSData *)gzippedData:(NSData *)data;

/** Returns YES if the data looks like it was gzip compressed by checking for the gzip magic number.
 *
 * @note: From https://en.wikipedia.org/wiki/Gzip, gzip's magic number is 1f 8b.
 * @return YES if the data appears gzipped, NO otherwise.
 */
+ (BOOL)isGzipped:(NSData *)data;

@end

NS_ASSUME_NONNULL_END
