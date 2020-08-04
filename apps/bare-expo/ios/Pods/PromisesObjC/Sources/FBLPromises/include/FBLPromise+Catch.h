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

@interface FBLPromise<Value>(CatchAdditions)

typedef void (^FBLPromiseCatchWorkBlock)(NSError *error) NS_SWIFT_UNAVAILABLE("");

/**
 Creates a pending promise which eventually gets resolved with same resolution as the receiver.
 If receiver is rejected, then `reject` block is executed asynchronously.

 @param reject A block to handle the error that receiver was rejected with.
 @return A new pending promise.
 */
- (FBLPromise *)catch:(FBLPromiseCatchWorkBlock)reject NS_SWIFT_UNAVAILABLE("");

/**
 Creates a pending promise which eventually gets resolved with same resolution as the receiver.
 If receiver is rejected, then `reject` block is executed asynchronously on the given queue.

 @param queue A queue to invoke the `reject` block on.
 @param reject A block to handle the error that receiver was rejected with.
 @return A new pending promise.
 */
- (FBLPromise *)onQueue:(dispatch_queue_t)queue
                  catch:(FBLPromiseCatchWorkBlock)reject NS_REFINED_FOR_SWIFT;

@end

/**
 Convenience dot-syntax wrappers for `FBLPromise` `catch` operators.
 Usage: promise.catch(^(NSError *error) { ... })
 */
@interface FBLPromise<Value>(DotSyntax_CatchAdditions)

- (FBLPromise* (^)(FBLPromiseCatchWorkBlock))catch FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
- (FBLPromise* (^)(dispatch_queue_t, FBLPromiseCatchWorkBlock))catchOn FBL_PROMISES_DOT_SYNTAX
    NS_SWIFT_UNAVAILABLE("");

@end

NS_ASSUME_NONNULL_END
