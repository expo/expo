/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "GDTLibrary/Private/GDTReachability.h"
#import "GDTLibrary/Private/GDTReachability_Private.h"

#import <GoogleDataTransport/GDTConsoleLogger.h>

#import <netinet/in.h>

/** Sets the _callbackFlag ivar whenever the network changes.
 *
 * @param reachability The reachability object calling back.
 * @param flags The new flag values.
 * @param info Any data that might be passed in by the callback.
 */
static void GDTReachabilityCallback(SCNetworkReachabilityRef reachability,
                                    SCNetworkReachabilityFlags flags,
                                    void *info);

@implementation GDTReachability {
  /** The reachability object. */
  SCNetworkReachabilityRef _reachabilityRef;

  /** The queue on which callbacks and all work will occur. */
  dispatch_queue_t _reachabilityQueue;

  /** Flags specified by reachability callbacks. */
  SCNetworkConnectionFlags _callbackFlags;
}

+ (void)load {
  [self sharedInstance];
}

+ (instancetype)sharedInstance {
  static GDTReachability *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTReachability alloc] init];
  });
  return sharedInstance;
}

+ (SCNetworkReachabilityFlags)currentFlags {
  __block SCNetworkReachabilityFlags currentFlags;
  dispatch_sync([GDTReachability sharedInstance] -> _reachabilityQueue, ^{
    GDTReachability *reachability = [GDTReachability sharedInstance];
    currentFlags = reachability->_flags ? reachability->_flags : reachability->_callbackFlags;
  });
  return currentFlags;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    struct sockaddr_in zeroAddress;
    bzero(&zeroAddress, sizeof(zeroAddress));
    zeroAddress.sin_len = sizeof(zeroAddress);
    zeroAddress.sin_family = AF_INET;

    _reachabilityQueue = dispatch_queue_create("com.google.GDTReachability", DISPATCH_QUEUE_SERIAL);
    _reachabilityRef = SCNetworkReachabilityCreateWithAddress(
        kCFAllocatorDefault, (const struct sockaddr *)&zeroAddress);
    Boolean success = SCNetworkReachabilitySetDispatchQueue(_reachabilityRef, _reachabilityQueue);
    if (!success) {
      GDTLogWarning(GDTMCWReachabilityFailed, @"%@", @"The reachability queue wasn't set.");
    }
    success = SCNetworkReachabilitySetCallback(_reachabilityRef, GDTReachabilityCallback, NULL);
    if (!success) {
      GDTLogWarning(GDTMCWReachabilityFailed, @"%@", @"The reachability callback wasn't set.");
    }

    // Get the initial set of flags.
    dispatch_async(_reachabilityQueue, ^{
      Boolean valid = SCNetworkReachabilityGetFlags(self->_reachabilityRef, &self->_flags);
      if (!valid) {
        self->_flags = 0;
      }
    });
  }
  return self;
}

- (void)setCallbackFlags:(SCNetworkReachabilityFlags)flags {
  if (_callbackFlags != flags) {
    self->_callbackFlags = flags;
  }
}

@end

static void GDTReachabilityCallback(SCNetworkReachabilityRef reachability,
                                    SCNetworkReachabilityFlags flags,
                                    void *info) {
  [[GDTReachability sharedInstance] setCallbackFlags:flags];
}
