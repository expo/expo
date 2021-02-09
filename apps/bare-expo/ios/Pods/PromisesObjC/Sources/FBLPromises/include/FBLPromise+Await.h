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
 Waits for promise resolution. The current thread blocks until the promise is resolved.

 @param promise Promise to wait for.
 @param error Error the promise was rejected with, or `nil` if the promise was fulfilled.
 @return Value the promise was fulfilled with. If the promise was rejected, the return value
         is always `nil`, but the error out arg is not.
 */
FOUNDATION_EXTERN id __nullable FBLPromiseAwait(FBLPromise *promise,
                                                NSError **error) NS_REFINED_FOR_SWIFT;

NS_ASSUME_NONNULL_END
