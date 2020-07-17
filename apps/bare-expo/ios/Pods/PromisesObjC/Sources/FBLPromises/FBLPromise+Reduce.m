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

#import "FBLPromise+Reduce.h"

#import "FBLPromisePrivate.h"

@implementation FBLPromise (ReduceAdditions)

- (FBLPromise *)reduce:(NSArray *)items combine:(FBLPromiseReducerBlock)reducer {
  return [self onQueue:FBLPromise.defaultDispatchQueue reduce:items combine:reducer];
}

- (FBLPromise *)onQueue:(dispatch_queue_t)queue
                 reduce:(NSArray *)items
                combine:(FBLPromiseReducerBlock)reducer {
  NSParameterAssert(queue);
  NSParameterAssert(items);
  NSParameterAssert(reducer);

  FBLPromise *promise = self;
  for (id item in items) {
    promise = [promise chainOnQueue:queue
                     chainedFulfill:^id(id value) {
                       return reducer(value, item);
                     }
                      chainedReject:nil];
  }
  return promise;
}

@end

@implementation FBLPromise (DotSyntax_ReduceAdditions)

- (FBLPromise * (^)(NSArray *, FBLPromiseReducerBlock))reduce {
  return ^(NSArray *items, FBLPromiseReducerBlock reducer) {
    return [self reduce:items combine:reducer];
  };
}

- (FBLPromise * (^)(dispatch_queue_t, NSArray *, FBLPromiseReducerBlock))reduceOn {
  return ^(dispatch_queue_t queue, NSArray *items, FBLPromiseReducerBlock reducer) {
    return [self onQueue:queue reduce:items combine:reducer];
  };
}

@end
