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

#import "FBLPromise+Race.h"

#import "FBLPromise+Async.h"
#import "FBLPromisePrivate.h"

@implementation FBLPromise (RaceAdditions)

+ (instancetype)race:(NSArray *)promises {
  return [self onQueue:self.defaultDispatchQueue race:promises];
}

+ (instancetype)onQueue:(dispatch_queue_t)queue race:(NSArray *)racePromises {
  NSParameterAssert(queue);
  NSAssert(racePromises.count > 0, @"No promises to observe");

  NSArray *promises = [racePromises copy];
  return [FBLPromise onQueue:queue
                       async:^(FBLPromiseFulfillBlock fulfill, FBLPromiseRejectBlock reject) {
                         for (id promise in promises) {
                           if (![promise isKindOfClass:self]) {
                             fulfill(promise);
                             return;
                           }
                         }
                         // Subscribe all, but only the first one to resolve will change
                         // the resulting promise's state.
                         for (FBLPromise *promise in promises) {
                           [promise observeOnQueue:queue fulfill:fulfill reject:reject];
                         }
                       }];
}

@end

@implementation FBLPromise (DotSyntax_RaceAdditions)

+ (FBLPromise * (^)(NSArray *))race {
  return ^(NSArray *promises) {
    return [self race:promises];
  };
}

+ (FBLPromise * (^)(dispatch_queue_t, NSArray *))raceOn {
  return ^(dispatch_queue_t queue, NSArray *promises) {
    return [self onQueue:queue race:promises];
  };
}

@end
