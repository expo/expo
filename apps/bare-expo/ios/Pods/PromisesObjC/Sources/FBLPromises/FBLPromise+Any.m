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

#import "FBLPromise+Any.h"

#import "FBLPromise+Async.h"
#import "FBLPromisePrivate.h"

static NSArray *FBLPromiseCombineValuesAndErrors(NSArray<FBLPromise *> *promises) {
  NSMutableArray *combinedValuesAndErrors = [[NSMutableArray alloc] init];
  for (FBLPromise *promise in promises) {
    if (promise.isFulfilled) {
      [combinedValuesAndErrors addObject:promise.value ?: [NSNull null]];
      continue;
    }
    if (promise.isRejected) {
      [combinedValuesAndErrors addObject:promise.error];
      continue;
    }
    assert(!promise.isPending);
  };
  return combinedValuesAndErrors;
}

@implementation FBLPromise (AnyAdditions)

+ (FBLPromise<NSArray *> *)any:(NSArray *)promises {
  return [self onQueue:FBLPromise.defaultDispatchQueue any:promises];
}

+ (FBLPromise<NSArray *> *)onQueue:(dispatch_queue_t)queue any:(NSArray *)anyPromises {
  NSParameterAssert(queue);
  NSParameterAssert(anyPromises);

  if (anyPromises.count == 0) {
    return [[FBLPromise alloc] initWithResolution:@[]];
  }
  NSMutableArray *promises = [anyPromises mutableCopy];
  return [FBLPromise
      onQueue:queue
        async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
          for (NSUInteger i = 0; i < promises.count; ++i) {
            id promise = promises[i];
            if ([promise isKindOfClass:self]) {
              continue;
            } else {
              [promises replaceObjectAtIndex:i
                                  withObject:[[FBLPromise alloc] initWithResolution:promise]];
            }
          }
          for (FBLPromise *promise in promises) {
            [promise observeOnQueue:queue
                fulfill:^(id __unused _) {
                  // Wait until all are resolved.
                  for (FBLPromise *promise in promises) {
                    if (promise.isPending) {
                      return;
                    }
                  }
                  // If called multiple times, only the first one affects the result.
                  fulfill(FBLPromiseCombineValuesAndErrors(promises));
                }
                reject:^(NSError *error) {
                  BOOL atLeastOneIsFulfilled = NO;
                  for (FBLPromise *promise in promises) {
                    if (promise.isPending) {
                      return;
                    }
                    if (promise.isFulfilled) {
                      atLeastOneIsFulfilled = YES;
                    }
                  }
                  if (atLeastOneIsFulfilled) {
                    fulfill(FBLPromiseCombineValuesAndErrors(promises));
                  } else {
                    reject(error);
                  }
                }];
          }
        }];
}

@end

@implementation FBLPromise (DotSyntax_AnyAdditions)

+ (FBLPromise<NSArray *> * (^)(NSArray *))any {
  return ^(NSArray *promises) {
    return [self any:promises];
  };
}

+ (FBLPromise<NSArray *> * (^)(dispatch_queue_t, NSArray *))anyOn {
  return ^(dispatch_queue_t queue, NSArray *promises) {
    return [self onQueue:queue any:promises];
  };
}

@end
