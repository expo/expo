// Copyright 2019 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "Private/FIRHeartbeatInfo.h"
#import <GoogleUtilities/GULHeartbeatDateStorage.h>
#import <GoogleUtilities/GULLogger.h>

const static long secondsInDay = 864000;
@implementation FIRHeartbeatInfo : NSObject

/** Updates the storage with the heartbeat information corresponding to this tag.
 * @param heartbeatTag Tag which could either be sdk specific tag or the global tag.
 * @return Boolean representing whether the heartbeat needs to be sent for this tag or not.
 */
+ (BOOL)updateIfNeededHeartbeatDateForTag:(NSString *)heartbeatTag {
  @synchronized(self) {
    NSString *const kHeartbeatStorageFile = @"HEARTBEAT_INFO_STORAGE";
    GULHeartbeatDateStorage *dataStorage =
        [[GULHeartbeatDateStorage alloc] initWithFileName:kHeartbeatStorageFile];
    NSDate *heartbeatTime = [dataStorage heartbeatDateForTag:heartbeatTag];
    NSDate *currentDate = [NSDate date];
    if (heartbeatTime != nil) {
      NSTimeInterval secondsBetween = [currentDate timeIntervalSinceDate:heartbeatTime];
      if (secondsBetween < secondsInDay) {
        return false;
      }
    }
    return [dataStorage setHearbeatDate:currentDate forTag:heartbeatTag];
  }
}

+ (FIRHeartbeatInfoCode)heartbeatCodeForTag:(NSString *)heartbeatTag {
  NSString *globalTag = @"GLOBAL";
  BOOL isSdkHeartbeatNeeded = [FIRHeartbeatInfo updateIfNeededHeartbeatDateForTag:heartbeatTag];
  BOOL isGlobalHeartbeatNeeded = [FIRHeartbeatInfo updateIfNeededHeartbeatDateForTag:globalTag];
  if (!isSdkHeartbeatNeeded && !isGlobalHeartbeatNeeded) {
    // Both sdk and global heartbeat not needed.
    return FIRHeartbeatInfoCodeNone;
  } else if (isSdkHeartbeatNeeded && !isGlobalHeartbeatNeeded) {
    // Only SDK heartbeat needed.
    return FIRHeartbeatInfoCodeSDK;
  } else if (!isSdkHeartbeatNeeded && isGlobalHeartbeatNeeded) {
    // Only global heartbeat needed.
    return FIRHeartbeatInfoCodeGlobal;
  } else {
    // Both sdk and global heartbeat are needed.
    return FIRHeartbeatInfoCodeCombined;
  }
}
@end
