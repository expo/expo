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

#import "FBLPromise+Testing.h"

BOOL FBLWaitForPromisesWithTimeout(NSTimeInterval timeout) {
  BOOL isTimedOut = NO;
  NSDate *timeoutDate = [NSDate dateWithTimeIntervalSinceNow:timeout];
  static NSTimeInterval const minimalTimeout = 0.01;
  static int64_t const minimalTimeToWait = (int64_t)(minimalTimeout * NSEC_PER_SEC);
  dispatch_time_t waitTime = dispatch_time(DISPATCH_TIME_NOW, minimalTimeToWait);
  dispatch_group_t dispatchGroup = FBLPromise.dispatchGroup;
  NSRunLoop *runLoop = NSRunLoop.currentRunLoop;
  while (dispatch_group_wait(dispatchGroup, waitTime)) {
    isTimedOut = timeoutDate.timeIntervalSinceNow < 0.0;
    if (isTimedOut) {
      break;
    }
    [runLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:minimalTimeout]];
  }
  return !isTimedOut;
}

@implementation FBLPromise (TestingAdditions)

// These properties are implemented in the FBLPromise class itself.
@dynamic isPending;
@dynamic isFulfilled;
@dynamic isRejected;
@dynamic pendingObjects;
@dynamic value;
@dynamic error;

+ (dispatch_group_t)dispatchGroup {
  static dispatch_group_t gDispatchGroup;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    gDispatchGroup = dispatch_group_create();
  });
  return gDispatchGroup;
}

@end
