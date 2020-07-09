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

#import "FBLPromiseError.h"

NS_ASSUME_NONNULL_BEGIN

/**
 Promises synchronization construct in Objective-C.
 */
@interface FBLPromise<__covariant Value> : NSObject

/**
 Default dispatch queue used for `FBLPromise`, which is `main` if a queue is not specified.
 */
@property(class) dispatch_queue_t defaultDispatchQueue NS_REFINED_FOR_SWIFT;

/**
 Creates a pending promise.
 */
+ (instancetype)pendingPromise NS_REFINED_FOR_SWIFT;

/**
 Creates a resolved promise.

 @param resolution An object to resolve the promise with: either a value or an error.
 @return A new resolved promise.
 */
+ (instancetype)resolvedWith:(nullable id)resolution NS_REFINED_FOR_SWIFT;

/**
 Synchronously fulfills the promise with a value.

 @param value An arbitrary value to fulfill the promise with, including `nil`.
 */
- (void)fulfill:(nullable Value)value NS_REFINED_FOR_SWIFT;

/**
 Synchronously rejects the promise with an error.

 @param error An error to reject the promise with.
 */
- (void)reject:(NSError *)error NS_REFINED_FOR_SWIFT;

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;
@end

@interface FBLPromise<Value>()

/**
 Adds an object to the set of pending objects to keep strongly while the promise is pending.
 Used by the Swift wrappers to keep them alive until the underlying ObjC promise is resolved.

 @param object An object to add.
 */
- (void)addPendingObject:(id)object NS_REFINED_FOR_SWIFT;

@end

#ifdef FBL_PROMISES_DOT_SYNTAX_IS_DEPRECATED
#define FBL_PROMISES_DOT_SYNTAX __attribute__((deprecated))
#else
#define FBL_PROMISES_DOT_SYNTAX
#endif

@interface FBLPromise<Value>(DotSyntaxAdditions)

/**
 Convenience dot-syntax wrappers for FBLPromise.
 Usage: FBLPromise.pending()
        FBLPromise.resolved(value)

 */
+ (instancetype (^)(void))pending FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (instancetype (^)(id __nullable))resolved FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");

@end

NS_ASSUME_NONNULL_END
