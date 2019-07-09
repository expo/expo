/* Copyright (c) 2016 Google Inc.
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

#import <Foundation/Foundation.h>
#import "GTLRDefines.h"

NS_ASSUME_NONNULL_BEGIN

/**
 *  An immutable class representing a string data type 'google-duration'.
 *  It is based off the protocol buffers definition:
 *  https://github.com/google/protobuf/blob/master/src/google/protobuf/duration.proto
 */
@interface GTLRDuration : NSObject <NSCopying>

/**
 *  Signed seconds of the span of time. Must be from -315,576,000,000
 *  to +315,576,000,000 inclusive.
 **/
@property(nonatomic, readonly) int64_t seconds;

/**
 *  Signed fractions of a second at nanosecond resolution of the span
 *  of time. Durations less than one second are represented with a 0
 *  `seconds` field and a positive or negative `nanos` field. For durations
 *  of one second or more, a non-zero value for the `nanos` field must be
 *  of the same sign as the `seconds` field. Must be from -999,999,999
 *  to +999,999,999 inclusive.
 **/
@property(nonatomic, readonly) int32_t nanos;

/**
 *  This duration expressed as a NSTimeInterval.
 *
 *  @note: Not all second/nanos combinations can be represented in a
 *  NSTimeInterval, so this could be a lossy transform.
 **/
@property(nonatomic, readonly) NSTimeInterval timeInterval;

/**
 * Returns the string form used to send this data type in a JSON payload.
 */
@property(nonatomic, readonly) NSString *jsonString;

/**
 *  Constructor for a new duration with the given seconds and nanoseconds.
 *
 *  Will fail if seconds/nanos differ in sign or if nanos is more than one
 *  second.
 **/
+ (nullable instancetype)durationWithSeconds:(int64_t)seconds
                                       nanos:(int32_t)nanos;

/**
 *  Constructor for a new duration from the given string form.
 *
 *  Will return nil if jsonString is invalid.
 **/
+ (nullable instancetype)durationWithJSONString:(nullable NSString *)jsonString;

/**
 *  Constructor for a new duration from the NSTimeInterval.
 *
 *  @note NSTimeInterval doesn't always express things as exactly as one might
 *  expect, so coverting from to integer seconds & nanos can reveal this.
 **/
+ (instancetype)durationWithTimeInterval:(NSTimeInterval)timeInterval;

@end

NS_ASSUME_NONNULL_END
