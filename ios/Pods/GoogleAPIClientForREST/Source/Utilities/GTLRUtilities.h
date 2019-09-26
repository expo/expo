/* Copyright (c) 2011 Google Inc.
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

#ifndef SKIP_GTLR_DEFINES
  #import "GTLRDefines.h"
#endif

NS_ASSUME_NONNULL_BEGIN

// Helper functions for implementing isEqual:
BOOL GTLR_AreEqualOrBothNil(id _Nullable obj1, id _Nullable obj2);
BOOL GTLR_AreBoolsEqual(BOOL b1, BOOL b2);

// Helper to ensure a number is a number.
//
// The Google API servers will send numbers >53 bits as strings to avoid
// bugs in some JavaScript implementations.  Work around this by catching
// the string and turning it back into a number.
NSNumber *GTLR_EnsureNSNumber(NSNumber *num);

@interface GTLRUtilities : NSObject

// Key-value coding searches in an array
//
// Utilities to get from an array objects having a known value (or nil)
// at a keyPath

+ (NSArray *)objectsFromArray:(NSArray *)sourceArray
                    withValue:(id)desiredValue
                   forKeyPath:(NSString *)keyPath;

+ (nullable id)firstObjectFromArray:(NSArray *)sourceArray
                          withValue:(id)desiredValue
                         forKeyPath:(NSString *)keyPath;

@end

NS_ASSUME_NONNULL_END
