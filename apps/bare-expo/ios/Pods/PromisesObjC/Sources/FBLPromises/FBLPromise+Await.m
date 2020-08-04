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

#import "FBLPromise+Await.h"

#import "FBLPromisePrivate.h"

id __nullable FBLPromiseAwait(FBLPromise *promise, NSError **outError) {
  assert(promise);

  static dispatch_once_t onceToken;
  static dispatch_queue_t queue;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.google.FBLPromises.Await", DISPATCH_QUEUE_CONCURRENT);
  });
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  id __block resolution;
  NSError __block *blockError;
  [promise chainOnQueue:queue
      chainedFulfill:^id(id value) {
        resolution = value;
        dispatch_semaphore_signal(semaphore);
        return value;
      }
      chainedReject:^id(NSError *error) {
        blockError = error;
        dispatch_semaphore_signal(semaphore);
        return error;
      }];
  dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
  if (outError) {
    *outError = blockError;
  }
  return resolution;
}
