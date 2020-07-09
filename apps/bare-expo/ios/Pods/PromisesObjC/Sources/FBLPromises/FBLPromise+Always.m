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

#import "FBLPromise+Always.h"

#import "FBLPromisePrivate.h"

@implementation FBLPromise (AlwaysAdditions)

- (FBLPromise *)always:(FBLPromiseAlwaysWorkBlock)work {
  return [self onQueue:FBLPromise.defaultDispatchQueue always:work];
}

- (FBLPromise *)onQueue:(dispatch_queue_t)queue always:(FBLPromiseAlwaysWorkBlock)work {
  NSParameterAssert(queue);
  NSParameterAssert(work);

  return [self chainOnQueue:queue
      chainedFulfill:^id(id value) {
        work();
        return value;
      }
      chainedReject:^id(NSError *error) {
        work();
        return error;
      }];
}

@end

@implementation FBLPromise (DotSyntax_AlwaysAdditions)

- (FBLPromise * (^)(FBLPromiseAlwaysWorkBlock))always {
  return ^(FBLPromiseAlwaysWorkBlock work) {
    return [self always:work];
  };
}

- (FBLPromise * (^)(dispatch_queue_t, FBLPromiseAlwaysWorkBlock))alwaysOn {
  return ^(dispatch_queue_t queue, FBLPromiseAlwaysWorkBlock work) {
    return [self onQueue:queue always:work];
  };
}

@end
