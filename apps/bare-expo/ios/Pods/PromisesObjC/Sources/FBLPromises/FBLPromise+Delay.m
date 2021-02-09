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

#import "FBLPromise+Delay.h"

#import "FBLPromisePrivate.h"

@implementation FBLPromise (DelayAdditions)

- (FBLPromise *)delay:(NSTimeInterval)interval {
  return [self onQueue:FBLPromise.defaultDispatchQueue delay:interval];
}

- (FBLPromise *)onQueue:(dispatch_queue_t)queue delay:(NSTimeInterval)interval {
  NSParameterAssert(queue);

  FBLPromise *promise = [[FBLPromise alloc] initPending];
  [self observeOnQueue:queue
      fulfill:^(id __nullable value) {
        dispatch_after(dispatch_time(0, (int64_t)(interval * NSEC_PER_SEC)), queue, ^{
          [promise fulfill:value];
        });
      }
      reject:^(NSError *error) {
        [promise reject:error];
      }];
  return promise;
}

@end

@implementation FBLPromise (DotSyntax_DelayAdditions)

- (FBLPromise * (^)(NSTimeInterval))delay {
  return ^(NSTimeInterval interval) {
    return [self delay:interval];
  };
}

- (FBLPromise * (^)(dispatch_queue_t, NSTimeInterval))delayOn {
  return ^(dispatch_queue_t queue, NSTimeInterval interval) {
    return [self onQueue:queue delay:interval];
  };
}

@end
