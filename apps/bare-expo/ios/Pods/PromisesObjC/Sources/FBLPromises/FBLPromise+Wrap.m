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

#import "FBLPromise+Wrap.h"

#import "FBLPromise+Async.h"

@implementation FBLPromise (WrapAdditions)

+ (instancetype)wrapCompletion:(void (^)(FBLPromiseCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapCompletion:work];
}

+ (instancetype)onQueue:(dispatch_queue_t)queue
         wrapCompletion:(void (^)(FBLPromiseCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock __unused _) {
                   work(^{
                     fulfill(nil);
                   });
                 }];
}

+ (instancetype)wrapObjectCompletion:(void (^)(FBLPromiseObjectCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapObjectCompletion:work];
}

+ (instancetype)onQueue:(dispatch_queue_t)queue
    wrapObjectCompletion:(void (^)(FBLPromiseObjectCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock __unused _) {
                   work(^(id __nullable value) {
                     fulfill(value);
                   });
                 }];
}

+ (instancetype)wrapErrorCompletion:(void (^)(FBLPromiseErrorCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapErrorCompletion:work];
}

+ (instancetype)onQueue:(dispatch_queue_t)queue
    wrapErrorCompletion:(void (^)(FBLPromiseErrorCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
                   work(^(NSError *__nullable error) {
                     if (error) {
                       reject(error);
                     } else {
                       fulfill(nil);
                     }
                   });
                 }];
}

+ (instancetype)wrapObjectOrErrorCompletion:(void (^)(FBLPromiseObjectOrErrorCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapObjectOrErrorCompletion:work];
}

+ (instancetype)onQueue:(dispatch_queue_t)queue
    wrapObjectOrErrorCompletion:(void (^)(FBLPromiseObjectOrErrorCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
                   work(^(id __nullable value, NSError *__nullable error) {
                     if (error) {
                       reject(error);
                     } else {
                       fulfill(value);
                     }
                   });
                 }];
}

+ (instancetype)wrapErrorOrObjectCompletion:(void (^)(FBLPromiseErrorOrObjectCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapErrorOrObjectCompletion:work];
}

+ (instancetype)onQueue:(dispatch_queue_t)queue
    wrapErrorOrObjectCompletion:(void (^)(FBLPromiseErrorOrObjectCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
                   work(^(NSError *__nullable error, id __nullable value) {
                     if (error) {
                       reject(error);
                     } else {
                       fulfill(value);
                     }
                   });
                 }];
}

+ (FBLPromise<NSArray *> *)wrap2ObjectsOrErrorCompletion:
    (void (^)(FBLPromise2ObjectsOrErrorCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrap2ObjectsOrErrorCompletion:work];
}

+ (FBLPromise<NSArray *> *)onQueue:(dispatch_queue_t)queue
     wrap2ObjectsOrErrorCompletion:(void (^)(FBLPromise2ObjectsOrErrorCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
                   work(^(id __nullable value1, id __nullable value2, NSError *__nullable error) {
                     if (error) {
                       reject(error);
                     } else {
                       fulfill(@[ value1, value2 ]);
                     }
                   });
                 }];
}

+ (FBLPromise<NSNumber *> *)wrapBoolCompletion:(void (^)(FBLPromiseBoolCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapBoolCompletion:work];
}

+ (FBLPromise<NSNumber *> *)onQueue:(dispatch_queue_t)queue
                 wrapBoolCompletion:(void (^)(FBLPromiseBoolCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock __unused _) {
                   work(^(BOOL value) {
                     fulfill(@(value));
                   });
                 }];
}

+ (FBLPromise<NSNumber *> *)wrapBoolOrErrorCompletion:
    (void (^)(FBLPromiseBoolOrErrorCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapBoolOrErrorCompletion:work];
}

+ (FBLPromise<NSNumber *> *)onQueue:(dispatch_queue_t)queue
          wrapBoolOrErrorCompletion:(void (^)(FBLPromiseBoolOrErrorCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
                   work(^(BOOL value, NSError *__nullable error) {
                     if (error) {
                       reject(error);
                     } else {
                       fulfill(@(value));
                     }
                   });
                 }];
}

+ (FBLPromise<NSNumber *> *)wrapIntegerCompletion:(void (^)(FBLPromiseIntegerCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapIntegerCompletion:work];
}

+ (FBLPromise<NSNumber *> *)onQueue:(dispatch_queue_t)queue
              wrapIntegerCompletion:(void (^)(FBLPromiseIntegerCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock __unused _) {
                   work(^(NSInteger value) {
                     fulfill(@(value));
                   });
                 }];
}

+ (FBLPromise<NSNumber *> *)wrapIntegerOrErrorCompletion:
    (void (^)(FBLPromiseIntegerOrErrorCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapIntegerOrErrorCompletion:work];
}

+ (FBLPromise<NSNumber *> *)onQueue:(dispatch_queue_t)queue
       wrapIntegerOrErrorCompletion:(void (^)(FBLPromiseIntegerOrErrorCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
                   work(^(NSInteger value, NSError *__nullable error) {
                     if (error) {
                       reject(error);
                     } else {
                       fulfill(@(value));
                     }
                   });
                 }];
}

+ (FBLPromise<NSNumber *> *)wrapDoubleCompletion:(void (^)(FBLPromiseDoubleCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapDoubleCompletion:work];
}

+ (FBLPromise<NSNumber *> *)onQueue:(dispatch_queue_t)queue
               wrapDoubleCompletion:(void (^)(FBLPromiseDoubleCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:(dispatch_queue_t)queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock __unused _) {
                   work(^(double value) {
                     fulfill(@(value));
                   });
                 }];
}

+ (FBLPromise<NSNumber *> *)wrapDoubleOrErrorCompletion:
    (void (^)(FBLPromiseDoubleOrErrorCompletion))work {
  return [self onQueue:self.defaultDispatchQueue wrapDoubleOrErrorCompletion:work];
}

+ (FBLPromise<NSNumber *> *)onQueue:(dispatch_queue_t)queue
        wrapDoubleOrErrorCompletion:(void (^)(FBLPromiseDoubleOrErrorCompletion))work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self onQueue:queue
                 async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
                   work(^(double value, NSError *__nullable error) {
                     if (error) {
                       reject(error);
                     } else {
                       fulfill(@(value));
                     }
                   });
                 }];
}

@end

@implementation FBLPromise (DotSyntax_WrapAdditions)

+ (FBLPromise * (^)(void (^)(FBLPromiseCompletion)))wrapCompletion {
  return ^(void (^work)(FBLPromiseCompletion)) {
    return [self wrapCompletion:work];
  };
}

+ (FBLPromise * (^)(dispatch_queue_t, void (^)(FBLPromiseCompletion)))wrapCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseCompletion)) {
    return [self onQueue:queue wrapCompletion:work];
  };
}

+ (FBLPromise * (^)(void (^)(FBLPromiseObjectCompletion)))wrapObjectCompletion {
  return ^(void (^work)(FBLPromiseObjectCompletion)) {
    return [self wrapObjectCompletion:work];
  };
}

+ (FBLPromise * (^)(dispatch_queue_t, void (^)(FBLPromiseObjectCompletion)))wrapObjectCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseObjectCompletion)) {
    return [self onQueue:queue wrapObjectCompletion:work];
  };
}

+ (FBLPromise * (^)(void (^)(FBLPromiseErrorCompletion)))wrapErrorCompletion {
  return ^(void (^work)(FBLPromiseErrorCompletion)) {
    return [self wrapErrorCompletion:work];
  };
}

+ (FBLPromise * (^)(dispatch_queue_t, void (^)(FBLPromiseErrorCompletion)))wrapErrorCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseErrorCompletion)) {
    return [self onQueue:queue wrapErrorCompletion:work];
  };
}

+ (FBLPromise * (^)(void (^)(FBLPromiseObjectOrErrorCompletion)))wrapObjectOrErrorCompletion {
  return ^(void (^work)(FBLPromiseObjectOrErrorCompletion)) {
    return [self wrapObjectOrErrorCompletion:work];
  };
}

+ (FBLPromise * (^)(dispatch_queue_t,
                    void (^)(FBLPromiseObjectOrErrorCompletion)))wrapObjectOrErrorCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseObjectOrErrorCompletion)) {
    return [self onQueue:queue wrapObjectOrErrorCompletion:work];
  };
}

+ (FBLPromise * (^)(void (^)(FBLPromiseErrorOrObjectCompletion)))wrapErrorOrObjectCompletion {
  return ^(void (^work)(FBLPromiseErrorOrObjectCompletion)) {
    return [self wrapErrorOrObjectCompletion:work];
  };
}

+ (FBLPromise * (^)(dispatch_queue_t,
                    void (^)(FBLPromiseErrorOrObjectCompletion)))wrapErrorOrObjectCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseErrorOrObjectCompletion)) {
    return [self onQueue:queue wrapErrorOrObjectCompletion:work];
  };
}

+ (FBLPromise<NSArray *> * (^)(void (^)(FBLPromise2ObjectsOrErrorCompletion)))
    wrap2ObjectsOrErrorCompletion {
  return ^(void (^work)(FBLPromise2ObjectsOrErrorCompletion)) {
    return [self wrap2ObjectsOrErrorCompletion:work];
  };
}

+ (FBLPromise<NSArray *> * (^)(dispatch_queue_t, void (^)(FBLPromise2ObjectsOrErrorCompletion)))
    wrap2ObjectsOrErrorCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromise2ObjectsOrErrorCompletion)) {
    return [self onQueue:queue wrap2ObjectsOrErrorCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(void (^)(FBLPromiseBoolCompletion)))wrapBoolCompletion {
  return ^(void (^work)(FBLPromiseBoolCompletion)) {
    return [self wrapBoolCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(dispatch_queue_t,
                                void (^)(FBLPromiseBoolCompletion)))wrapBoolCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseBoolCompletion)) {
    return [self onQueue:queue wrapBoolCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(void (^)(FBLPromiseBoolOrErrorCompletion)))
    wrapBoolOrErrorCompletion {
  return ^(void (^work)(FBLPromiseBoolOrErrorCompletion)) {
    return [self wrapBoolOrErrorCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(dispatch_queue_t, void (^)(FBLPromiseBoolOrErrorCompletion)))
    wrapBoolOrErrorCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseBoolOrErrorCompletion)) {
    return [self onQueue:queue wrapBoolOrErrorCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(void (^)(FBLPromiseIntegerCompletion)))wrapIntegerCompletion {
  return ^(void (^work)(FBLPromiseIntegerCompletion)) {
    return [self wrapIntegerCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(dispatch_queue_t,
                                void (^)(FBLPromiseIntegerCompletion)))wrapIntegerCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseIntegerCompletion)) {
    return [self onQueue:queue wrapIntegerCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(void (^)(FBLPromiseIntegerOrErrorCompletion)))
    wrapIntegerOrErrorCompletion {
  return ^(void (^work)(FBLPromiseIntegerOrErrorCompletion)) {
    return [self wrapIntegerOrErrorCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(dispatch_queue_t, void (^)(FBLPromiseIntegerOrErrorCompletion)))
    wrapIntegerOrErrorCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseIntegerOrErrorCompletion)) {
    return [self onQueue:queue wrapIntegerOrErrorCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(void (^)(FBLPromiseDoubleCompletion)))wrapDoubleCompletion {
  return ^(void (^work)(FBLPromiseDoubleCompletion)) {
    return [self wrapDoubleCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(dispatch_queue_t,
                                void (^)(FBLPromiseDoubleCompletion)))wrapDoubleCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseDoubleCompletion)) {
    return [self onQueue:queue wrapDoubleCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(void (^)(FBLPromiseDoubleOrErrorCompletion)))
    wrapDoubleOrErrorCompletion {
  return ^(void (^work)(FBLPromiseDoubleOrErrorCompletion)) {
    return [self wrapDoubleOrErrorCompletion:work];
  };
}

+ (FBLPromise<NSNumber *> * (^)(dispatch_queue_t, void (^)(FBLPromiseDoubleOrErrorCompletion)))
    wrapDoubleOrErrorCompletionOn {
  return ^(dispatch_queue_t queue, void (^work)(FBLPromiseDoubleOrErrorCompletion)) {
    return [self onQueue:queue wrapDoubleOrErrorCompletion:work];
  };
}

@end
