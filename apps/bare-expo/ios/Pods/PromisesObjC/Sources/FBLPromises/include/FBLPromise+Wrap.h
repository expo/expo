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
 Different types of completion handlers available to be wrapped with promise.
 */
typedef void (^FBLPromiseCompletion)(void) NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseObjectCompletion)(id __nullable) NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseErrorCompletion)(NSError* __nullable) NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseObjectOrErrorCompletion)(id __nullable, NSError* __nullable)
    NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseErrorOrObjectCompletion)(NSError* __nullable, id __nullable)
    NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromise2ObjectsOrErrorCompletion)(id __nullable, id __nullable,
                                                    NSError* __nullable) NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseBoolCompletion)(BOOL) NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseBoolOrErrorCompletion)(BOOL, NSError* __nullable) NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseIntegerCompletion)(NSInteger) NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseIntegerOrErrorCompletion)(NSInteger, NSError* __nullable)
    NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseDoubleCompletion)(double) NS_SWIFT_UNAVAILABLE("");
typedef void (^FBLPromiseDoubleOrErrorCompletion)(double, NSError* __nullable)
    NS_SWIFT_UNAVAILABLE("");

/**
 Provides an easy way to convert methods that use common callback patterns into promises.
 */
@interface FBLPromise<Value>(WrapAdditions)

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with `nil` when completion handler is invoked.
 */
+ (instancetype)wrapCompletion:(void (^)(FBLPromiseCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with `nil` when completion handler is invoked.
 */
+ (instancetype)onQueue:(dispatch_queue_t)queue
         wrapCompletion:(void (^)(FBLPromiseCompletion handler))work NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an object provided by completion handler.
 */
+ (instancetype)wrapObjectCompletion:(void (^)(FBLPromiseObjectCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an object provided by completion handler.
 */
+ (instancetype)onQueue:(dispatch_queue_t)queue
    wrapObjectCompletion:(void (^)(FBLPromiseObjectCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an error provided by completion handler.
 If error is `nil`, fulfills with `nil`, otherwise rejects with the error.
 */
+ (instancetype)wrapErrorCompletion:(void (^)(FBLPromiseErrorCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an error provided by completion handler.
 If error is `nil`, fulfills with `nil`, otherwise rejects with the error.
 */
+ (instancetype)onQueue:(dispatch_queue_t)queue
    wrapErrorCompletion:(void (^)(FBLPromiseErrorCompletion handler))work NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an object provided by completion handler if error is `nil`.
 Otherwise, rejects with the error.
 */
+ (instancetype)wrapObjectOrErrorCompletion:
    (void (^)(FBLPromiseObjectOrErrorCompletion handler))work NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an object provided by completion handler if error is `nil`.
 Otherwise, rejects with the error.
 */
+ (instancetype)onQueue:(dispatch_queue_t)queue
    wrapObjectOrErrorCompletion:(void (^)(FBLPromiseObjectOrErrorCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an error or object provided by completion handler. If error
 is not `nil`, rejects with the error.
 */
+ (instancetype)wrapErrorOrObjectCompletion:
    (void (^)(FBLPromiseErrorOrObjectCompletion handler))work NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an error or object provided by completion handler. If error
 is not `nil`, rejects with the error.
 */
+ (instancetype)onQueue:(dispatch_queue_t)queue
    wrapErrorOrObjectCompletion:(void (^)(FBLPromiseErrorOrObjectCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an array of objects provided by completion handler in order
 if error is `nil`. Otherwise, rejects with the error.
 */
+ (FBLPromise<NSArray*>*)wrap2ObjectsOrErrorCompletion:
    (void (^)(FBLPromise2ObjectsOrErrorCompletion handler))work NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an array of objects provided by completion handler in order
 if error is `nil`. Otherwise, rejects with the error.
 */
+ (FBLPromise<NSArray*>*)onQueue:(dispatch_queue_t)queue
    wrap2ObjectsOrErrorCompletion:(void (^)(FBLPromise2ObjectsOrErrorCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping YES/NO.
 */
+ (FBLPromise<NSNumber*>*)wrapBoolCompletion:(void (^)(FBLPromiseBoolCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping YES/NO.
 */
+ (FBLPromise<NSNumber*>*)onQueue:(dispatch_queue_t)queue
               wrapBoolCompletion:(void (^)(FBLPromiseBoolCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping YES/NO when error is `nil`.
 Otherwise rejects with the error.
 */
+ (FBLPromise<NSNumber*>*)wrapBoolOrErrorCompletion:
    (void (^)(FBLPromiseBoolOrErrorCompletion handler))work NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping YES/NO when error is `nil`.
 Otherwise rejects with the error.
 */
+ (FBLPromise<NSNumber*>*)onQueue:(dispatch_queue_t)queue
        wrapBoolOrErrorCompletion:(void (^)(FBLPromiseBoolOrErrorCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping an integer.
 */
+ (FBLPromise<NSNumber*>*)wrapIntegerCompletion:(void (^)(FBLPromiseIntegerCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping an integer.
 */
+ (FBLPromise<NSNumber*>*)onQueue:(dispatch_queue_t)queue
            wrapIntegerCompletion:(void (^)(FBLPromiseIntegerCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping an integer when error is `nil`.
 Otherwise rejects with the error.
 */
+ (FBLPromise<NSNumber*>*)wrapIntegerOrErrorCompletion:
    (void (^)(FBLPromiseIntegerOrErrorCompletion handler))work NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping an integer when error is `nil`.
 Otherwise rejects with the error.
 */
+ (FBLPromise<NSNumber*>*)onQueue:(dispatch_queue_t)queue
     wrapIntegerOrErrorCompletion:(void (^)(FBLPromiseIntegerOrErrorCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping a double.
 */
+ (FBLPromise<NSNumber*>*)wrapDoubleCompletion:(void (^)(FBLPromiseDoubleCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping a double.
 */
+ (FBLPromise<NSNumber*>*)onQueue:(dispatch_queue_t)queue
             wrapDoubleCompletion:(void (^)(FBLPromiseDoubleCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

/**
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping a double when error is `nil`.
 Otherwise rejects with the error.
 */
+ (FBLPromise<NSNumber*>*)wrapDoubleOrErrorCompletion:
    (void (^)(FBLPromiseDoubleOrErrorCompletion handler))work NS_SWIFT_UNAVAILABLE("");

/**
 @param queue A queue to invoke the `work` block on.
 @param work A block to perform any operations needed to resolve the promise.
 @returns A promise that resolves with an `NSNumber` wrapping a double when error is `nil`.
 Otherwise rejects with the error.
 */
+ (FBLPromise<NSNumber*>*)onQueue:(dispatch_queue_t)queue
      wrapDoubleOrErrorCompletion:(void (^)(FBLPromiseDoubleOrErrorCompletion handler))work
    NS_SWIFT_UNAVAILABLE("");

@end

/**
 Convenience dot-syntax wrappers for `FBLPromise` `wrap` operators.
 Usage: FBLPromise.wrapCompletion(^(FBLPromiseCompletion handler) {...})
 */
@interface FBLPromise<Value>(DotSyntax_WrapAdditions)

+ (FBLPromise* (^)(void (^)(FBLPromiseCompletion)))wrapCompletion FBL_PROMISES_DOT_SYNTAX
    NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(dispatch_queue_t, void (^)(FBLPromiseCompletion)))wrapCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(void (^)(FBLPromiseObjectCompletion)))wrapObjectCompletion
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(dispatch_queue_t, void (^)(FBLPromiseObjectCompletion)))wrapObjectCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(void (^)(FBLPromiseErrorCompletion)))wrapErrorCompletion FBL_PROMISES_DOT_SYNTAX
    NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(dispatch_queue_t, void (^)(FBLPromiseErrorCompletion)))wrapErrorCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(void (^)(FBLPromiseObjectOrErrorCompletion)))wrapObjectOrErrorCompletion
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(dispatch_queue_t,
                   void (^)(FBLPromiseObjectOrErrorCompletion)))wrapObjectOrErrorCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(void (^)(FBLPromiseErrorOrObjectCompletion)))wrapErrorOrObjectCompletion
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise* (^)(dispatch_queue_t,
                   void (^)(FBLPromiseErrorOrObjectCompletion)))wrapErrorOrObjectCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSArray*>* (^)(void (^)(FBLPromise2ObjectsOrErrorCompletion)))
    wrap2ObjectsOrErrorCompletion FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSArray*>* (^)(dispatch_queue_t, void (^)(FBLPromise2ObjectsOrErrorCompletion)))
    wrap2ObjectsOrErrorCompletionOn FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(void (^)(FBLPromiseBoolCompletion)))wrapBoolCompletion
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(dispatch_queue_t,
                              void (^)(FBLPromiseBoolCompletion)))wrapBoolCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(void (^)(FBLPromiseBoolOrErrorCompletion)))wrapBoolOrErrorCompletion
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(dispatch_queue_t,
                              void (^)(FBLPromiseBoolOrErrorCompletion)))wrapBoolOrErrorCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(void (^)(FBLPromiseIntegerCompletion)))wrapIntegerCompletion
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(dispatch_queue_t,
                              void (^)(FBLPromiseIntegerCompletion)))wrapIntegerCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(void (^)(FBLPromiseIntegerOrErrorCompletion)))
    wrapIntegerOrErrorCompletion FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(dispatch_queue_t, void (^)(FBLPromiseIntegerOrErrorCompletion)))
    wrapIntegerOrErrorCompletionOn FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(void (^)(FBLPromiseDoubleCompletion)))wrapDoubleCompletion
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(dispatch_queue_t,
                              void (^)(FBLPromiseDoubleCompletion)))wrapDoubleCompletionOn
    FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(void (^)(FBLPromiseDoubleOrErrorCompletion)))
    wrapDoubleOrErrorCompletion FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");
+ (FBLPromise<NSNumber*>* (^)(dispatch_queue_t, void (^)(FBLPromiseDoubleOrErrorCompletion)))
    wrapDoubleOrErrorCompletionOn FBL_PROMISES_DOT_SYNTAX NS_SWIFT_UNAVAILABLE("");

@end

NS_ASSUME_NONNULL_END
