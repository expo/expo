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

#import "FBLPromise+Retry.h"

#import "FBLPromisePrivate.h"

NSInteger const FBLPromiseRetryDefaultAttemptsCount = 1;
NSTimeInterval const FBLPromiseRetryDefaultDelayInterval = 1.0;

static void FBLPromiseRetryAttempt(FBLPromise *promise, dispatch_queue_t queue, NSInteger count,
                                   NSTimeInterval interval, FBLPromiseRetryPredicateBlock predicate,
                                   FBLPromiseRetryWorkBlock work) {
  __auto_type retrier = ^(id __nullable value) {
    if ([value isKindOfClass:[NSError class]]) {
      if (count <= 0 || (predicate && !predicate(count, value))) {
        [promise reject:value];
      } else {
        dispatch_after(dispatch_time(0, (int64_t)(interval * NSEC_PER_SEC)), queue, ^{
          FBLPromiseRetryAttempt(promise, queue, count - 1, interval, predicate, work);
        });
      }
    } else {
      [promise fulfill:value];
    }
  };
  id value = work();
  if ([value isKindOfClass:[FBLPromise class]]) {
    [(FBLPromise *)value observeOnQueue:queue fulfill:retrier reject:retrier];
  } else  {
    retrier(value);
  }
}

@implementation FBLPromise (RetryAdditions)

+ (FBLPromise *)retry:(FBLPromiseRetryWorkBlock)work {
  return [self onQueue:FBLPromise.defaultDispatchQueue retry:work];
}

+ (FBLPromise *)onQueue:(dispatch_queue_t)queue retry:(FBLPromiseRetryWorkBlock)work {
  return [self onQueue:queue attempts:FBLPromiseRetryDefaultAttemptsCount retry:work];
}

+ (FBLPromise *)attempts:(NSInteger)count retry:(FBLPromiseRetryWorkBlock)work {
  return [self onQueue:FBLPromise.defaultDispatchQueue attempts:count retry:work];
}

+ (FBLPromise *)onQueue:(dispatch_queue_t)queue
               attempts:(NSInteger)count
                  retry:(FBLPromiseRetryWorkBlock)work {
  return [self onQueue:queue
              attempts:count
                 delay:FBLPromiseRetryDefaultDelayInterval
             condition:nil
                 retry:work];
}

+ (FBLPromise *)attempts:(NSInteger)count
                   delay:(NSTimeInterval)interval
               condition:(nullable FBLPromiseRetryPredicateBlock)predicate
                   retry:(FBLPromiseRetryWorkBlock)work {
  return [self onQueue:FBLPromise.defaultDispatchQueue
              attempts:count
                 delay:interval
             condition:predicate
                 retry:work];
}

+ (FBLPromise *)onQueue:(dispatch_queue_t)queue
               attempts:(NSInteger)count
                  delay:(NSTimeInterval)interval
              condition:(nullable FBLPromiseRetryPredicateBlock)predicate
                  retry:(FBLPromiseRetryWorkBlock)work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  FBLPromise *promise = [[FBLPromise alloc] initPending];
  FBLPromiseRetryAttempt(promise, queue, count, interval, predicate, work);
  return promise;
}

@end

@implementation FBLPromise (DotSyntax_RetryAdditions)

+ (FBLPromise * (^)(FBLPromiseRetryWorkBlock))retry {
  return ^id(FBLPromiseRetryWorkBlock work) {
    return [self retry:work];
  };
}

+ (FBLPromise * (^)(dispatch_queue_t, FBLPromiseRetryWorkBlock))retryOn {
  return ^id(dispatch_queue_t queue, FBLPromiseRetryWorkBlock work) {
    return [self onQueue:queue retry:work];
  };
}

+ (FBLPromise * (^)(NSInteger, NSTimeInterval, FBLPromiseRetryPredicateBlock,
                    FBLPromiseRetryWorkBlock))retryAgain {
  return ^id(NSInteger count, NSTimeInterval interval, FBLPromiseRetryPredicateBlock predicate,
             FBLPromiseRetryWorkBlock work) {
    return [self attempts:count delay:interval condition:predicate retry:work];
  };
}

+ (FBLPromise * (^)(dispatch_queue_t, NSInteger, NSTimeInterval, FBLPromiseRetryPredicateBlock,
                    FBLPromiseRetryWorkBlock))retryAgainOn {
  return ^id(dispatch_queue_t queue, NSInteger count, NSTimeInterval interval,
             FBLPromiseRetryPredicateBlock predicate, FBLPromiseRetryWorkBlock work) {
    return [self onQueue:queue attempts:count delay:interval condition:predicate retry:work];
  };
}

@end
