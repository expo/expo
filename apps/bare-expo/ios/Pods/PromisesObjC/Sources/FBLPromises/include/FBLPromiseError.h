/**
 Copyright 2018 Google Inc. All rights reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at:

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXTERN NSErrorDomain const FBLPromiseErrorDomain NS_REFINED_FOR_SWIFT;

/**
 Possible error codes in `FBLPromiseErrorDomain`.
 */
typedef NS_ENUM(NSInteger, FBLPromiseErrorCode) {
  /** Promise failed to resolve in time. */
  FBLPromiseErrorCodeTimedOut = 1,
  /** Validation predicate returned false. */
  FBLPromiseErrorCodeValidationFailure = 2,
} NS_REFINED_FOR_SWIFT;

NS_INLINE BOOL FBLPromiseErrorIsTimedOut(NSError *error) NS_SWIFT_UNAVAILABLE("") {
  return error.domain == FBLPromiseErrorDomain &&
         error.code == FBLPromiseErrorCodeTimedOut;
}

NS_INLINE BOOL FBLPromiseErrorIsValidationFailure(NSError *error) NS_SWIFT_UNAVAILABLE("") {
  return error.domain == FBLPromiseErrorDomain &&
         error.code == FBLPromiseErrorCodeValidationFailure;
}

NS_ASSUME_NONNULL_END
