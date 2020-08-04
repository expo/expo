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

/**
 Waits for all scheduled promises blocks.

 @param timeout Maximum time to wait.
 @return YES if all promises blocks have completed before the timeout and NO otherwise.
 */
FOUNDATION_EXTERN BOOL FBLWaitForPromisesWithTimeout(NSTimeInterval timeout) NS_REFINED_FOR_SWIFT;

@interface FBLPromise<Value>(TestingAdditions)

/**
 Dispatch group for promises that is typically used to wait for all scheduled blocks.
 */
@property(class, nonatomic, readonly) dispatch_group_t dispatchGroup NS_REFINED_FOR_SWIFT;

/**
 Properties to get the current state of the promise.
 */
@property(nonatomic, readonly) BOOL isPending NS_REFINED_FOR_SWIFT;
@property(nonatomic, readonly) BOOL isFulfilled NS_REFINED_FOR_SWIFT;
@property(nonatomic, readonly) BOOL isRejected NS_REFINED_FOR_SWIFT;

/**
 Value the promise was fulfilled with.
 Can be nil if the promise is still pending, was resolved with nil or after it has been rejected.
 */
@property(nonatomic, readonly, nullable) Value value NS_REFINED_FOR_SWIFT;

/**
 Error the promise was rejected with.
 Can be nil if the promise is still pending or after it has been fulfilled.
 */
@property(nonatomic, readonly, nullable) NSError *error NS_REFINED_FOR_SWIFT;

@end

NS_ASSUME_NONNULL_END
