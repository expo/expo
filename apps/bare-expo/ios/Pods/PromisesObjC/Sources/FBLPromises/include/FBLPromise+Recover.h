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

@interface FBLPromise<Value>(RecoverAdditions)

typedef id __nullable (^FBLPromiseRecoverWorkBlock)(NSError *error) NS_SWIFT_UNAVAILABLE("");

/**
 Provides a new promise to recover in case the receiver gets rejected.

 @param recovery A block to handle the error that the receiver was rejected with.
 @return A new pending promise to use instead of the rejected one that gets resolved with resolution
         returned from `recovery` block.
 */
- (FBLPromise *)recover:(FBLPromiseRecoverWorkBlock)recovery NS_SWIFT_UNAVAILABLE("");

/**
 Provides a new promise to recover in case the receiver gets rejected.

 @param queue A queue to dispatch on.
 @param recovery A block to handle the error that the receiver was rejected with.
 @return A new pending promise to use instead of the rejected one that gets resolved with resolution
         returned from `recovery` block.
 */
- (FBLPromise *)onQueue:(dispatch_queue_t)queue
                recover:(FBLPromiseRecoverWorkBlock)recovery NS_REFINED_FOR_SWIFT;

@end

/**
 Convenience dot-syntax wrappers for `FBLPromise` `recover` operators.
 Usage: promise.recover(^id(NSError *error) {...})
 */
@interface FBLPromise<Value>(DotSyntax_RecoverAdditions)

- (FBLPromise * (^)(FBLPromiseRecoverWorkBlock))recover FBL_PROMISES_DOT_SYNTAX
    NS_SWIFT_UNAVAILABLE("");
- (FBLPromise * (^)(dispatch_queue_t, FBLPromiseRecoverWorkBlock))recoverOn FBL_PROMISES_DOT_SYNTAX
    NS_SWIFT_UNAVAILABLE("");

@end

NS_ASSUME_NONNULL_END
