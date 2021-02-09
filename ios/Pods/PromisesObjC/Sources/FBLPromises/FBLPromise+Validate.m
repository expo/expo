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

#import "FBLPromise+Validate.h"

#import "FBLPromisePrivate.h"

@implementation FBLPromise (ValidateAdditions)

- (FBLPromise*)validate:(FBLPromiseValidateWorkBlock)predicate {
  return [self onQueue:FBLPromise.defaultDispatchQueue validate:predicate];
}

- (FBLPromise*)onQueue:(dispatch_queue_t)queue validate:(FBLPromiseValidateWorkBlock)predicate {
  NSParameterAssert(queue);
  NSParameterAssert(predicate);

  FBLPromiseChainedFulfillBlock chainedFulfill = ^id(id value) {
    return predicate(value) ? value :
                              [[NSError alloc] initWithDomain:FBLPromiseErrorDomain
                                                         code:FBLPromiseErrorCodeValidationFailure
                                                     userInfo:nil];
  };
  return [self chainOnQueue:queue chainedFulfill:chainedFulfill chainedReject:nil];
}

@end

@implementation FBLPromise (DotSyntax_ValidateAdditions)

- (FBLPromise* (^)(FBLPromiseValidateWorkBlock))validate {
  return ^(FBLPromiseValidateWorkBlock predicate) {
    return [self validate:predicate];
  };
}

- (FBLPromise* (^)(dispatch_queue_t, FBLPromiseValidateWorkBlock))validateOn {
  return ^(dispatch_queue_t queue, FBLPromiseValidateWorkBlock predicate) {
    return [self onQueue:queue validate:predicate];
  };
}

@end
