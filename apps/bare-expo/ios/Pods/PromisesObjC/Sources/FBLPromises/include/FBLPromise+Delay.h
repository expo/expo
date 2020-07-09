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

#import "FBLPromise.h"

NS_ASSUME_NONNULL_BEGIN

@interface FBLPromise<Value>(DelayAdditions)

/**
 Creates a new pending promise that fulfills with the same value as `self` after the `delay`, or
 rejects with the same error immediately.

 @param interval Time to wait in seconds.
 @return A new pending promise that fulfills at least `delay` seconds later than `self`, or rejects
         with the same error immediately.
 */
- (FBLPromise *)delay:(NSTimeInterval)interval NS_SWIFT_UNAVAILABLE("");

/**
 Creates a new pending promise that fulfills with the same value as `self` after the `delay`, or
 rejects with the same error immediately.

 @param queue A queue to dispatch on.
 @param interval Time to wait in seconds.
 @return A new pending promise that fulfills at least `delay` seconds later than `self`, or rejects
         with the same error immediately.
 */
- (FBLPromise *)onQueue:(dispatch_queue_t)queue
                  delay:(NSTimeInterval)interval NS_REFINED_FOR_SWIFT;

@end

/**
 Convenience dot-syntax wrappers for `FBLPromise` `delay` operators.
 Usage: promise.delay(...)
 */
@interface FBLPromise<Value>(DotSyntax_DelayAdditions)

- (FBLPromise * (^)(NSTimeInterval))delay FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
- (FBLPromise * (^)(dispatch_queue_t, NSTimeInterval))delayOn FBL_PROMISES_DOT_SYNTAX
    NS_SWIFT_UNAVAILABLE("");

@end

NS_ASSUME_NONNULL_END
