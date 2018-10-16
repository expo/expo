// Copyright 2017 Google
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

#import <Foundation/Foundation.h>

#import "Private/FIRReachabilityChecker+Internal.h"
#import "Private/FIRReachabilityChecker.h"

#import "Private/FIRLogger.h"
#import "Private/FIRNetwork.h"
#import "Private/FIRNetworkMessageCode.h"

static void ReachabilityCallback(SCNetworkReachabilityRef reachability,
                                 SCNetworkReachabilityFlags flags,
                                 void *info);

static const struct FIRReachabilityApi kFIRDefaultReachabilityApi = {
    SCNetworkReachabilityCreateWithName,
    SCNetworkReachabilitySetCallback,
    SCNetworkReachabilityScheduleWithRunLoop,
    SCNetworkReachabilityUnscheduleFromRunLoop,
    CFRelease,
};

static NSString *const kFIRReachabilityUnknownStatus = @"Unknown";
static NSString *const kFIRReachabilityConnectedStatus = @"Connected";
static NSString *const kFIRReachabilityDisconnectedStatus = @"Disconnected";

@interface FIRReachabilityChecker ()

@property(nonatomic, assign) const struct FIRReachabilityApi *reachabilityApi;
@property(nonatomic, assign) FIRReachabilityStatus reachabilityStatus;
@property(nonatomic, copy) NSString *host;
@property(nonatomic, assign) SCNetworkReachabilityRef reachability;

@end

@implementation FIRReachabilityChecker

@synthesize reachabilityApi = reachabilityApi_;
@synthesize reachability = reachability_;

- (const struct FIRReachabilityApi *)reachabilityApi {
  return reachabilityApi_;
}

- (void)setReachabilityApi:(const struct FIRReachabilityApi *)reachabilityApi {
  if (reachability_) {
    NSString *message =
        @"Cannot change reachability API while reachability is running. "
        @"Call stop first.";
    [loggerDelegate_ firNetwork_logWithLevel:kFIRNetworkLogLevelError
                                 messageCode:kFIRNetworkMessageCodeReachabilityChecker000
                                     message:message];
    return;
  }
  reachabilityApi_ = reachabilityApi;
}

@synthesize reachabilityStatus = reachabilityStatus_;
@synthesize host = host_;
@synthesize reachabilityDelegate = reachabilityDelegate_;
@synthesize loggerDelegate = loggerDelegate_;

- (BOOL)isActive {
  return reachability_ != nil;
}

- (void)setReachabilityDelegate:(id<FIRReachabilityDelegate>)reachabilityDelegate {
  if (reachabilityDelegate &&
      (![(NSObject *)reachabilityDelegate conformsToProtocol:@protocol(FIRReachabilityDelegate)])) {
    FIRLogError(kFIRLoggerCore,
                [NSString stringWithFormat:@"I-NET%06ld",
                                           (long)kFIRNetworkMessageCodeReachabilityChecker005],
                @"Reachability delegate doesn't conform to Reachability protocol.");
    return;
  }
  reachabilityDelegate_ = reachabilityDelegate;
}

- (void)setLoggerDelegate:(id<FIRNetworkLoggerDelegate>)loggerDelegate {
  if (loggerDelegate &&
      (![(NSObject *)loggerDelegate conformsToProtocol:@protocol(FIRNetworkLoggerDelegate)])) {
    FIRLogError(kFIRLoggerCore,
                [NSString stringWithFormat:@"I-NET%06ld",
                                           (long)kFIRNetworkMessageCodeReachabilityChecker006],
                @"Reachability delegate doesn't conform to Logger protocol.");
    return;
  }
  loggerDelegate_ = loggerDelegate;
}

- (instancetype)initWithReachabilityDelegate:(id<FIRReachabilityDelegate>)reachabilityDelegate
                              loggerDelegate:(id<FIRNetworkLoggerDelegate>)loggerDelegate
                                    withHost:(NSString *)host {
  self = [super init];

  [self setLoggerDelegate:loggerDelegate];

  if (!host || !host.length) {
    [loggerDelegate_ firNetwork_logWithLevel:kFIRNetworkLogLevelError
                                 messageCode:kFIRNetworkMessageCodeReachabilityChecker001
                                     message:@"Invalid host specified"];
    return nil;
  }
  if (self) {
    [self setReachabilityDelegate:reachabilityDelegate];
    reachabilityApi_ = &kFIRDefaultReachabilityApi;
    reachabilityStatus_ = kFIRReachabilityUnknown;
    host_ = [host copy];
    reachability_ = nil;
  }
  return self;
}

- (void)dealloc {
  reachabilityDelegate_ = nil;
  loggerDelegate_ = nil;
  [self stop];
}

- (BOOL)start {
  if (!reachability_) {
    reachability_ = reachabilityApi_->createWithNameFn(kCFAllocatorDefault, [host_ UTF8String]);
    if (!reachability_) {
      return NO;
    }
    SCNetworkReachabilityContext context = {
        0,                       /* version */
        (__bridge void *)(self), /* info (passed as last parameter to reachability callback) */
        NULL,                    /* retain */
        NULL,                    /* release */
        NULL                     /* copyDescription */
    };
    if (!reachabilityApi_->setCallbackFn(reachability_, ReachabilityCallback, &context) ||
        !reachabilityApi_->scheduleWithRunLoopFn(reachability_, CFRunLoopGetMain(),
                                                 kCFRunLoopCommonModes)) {
      reachabilityApi_->releaseFn(reachability_);
      reachability_ = nil;
      [loggerDelegate_ firNetwork_logWithLevel:kFIRNetworkLogLevelError
                                   messageCode:kFIRNetworkMessageCodeReachabilityChecker002
                                       message:@"Failed to start reachability handle"];
      return NO;
    }
  }
  [loggerDelegate_ firNetwork_logWithLevel:kFIRNetworkLogLevelDebug
                               messageCode:kFIRNetworkMessageCodeReachabilityChecker003
                                   message:@"Monitoring the network status"];
  return YES;
}

- (void)stop {
  if (reachability_) {
    reachabilityStatus_ = kFIRReachabilityUnknown;
    reachabilityApi_->unscheduleFromRunLoopFn(reachability_, CFRunLoopGetMain(),
                                              kCFRunLoopCommonModes);
    reachabilityApi_->releaseFn(reachability_);
    reachability_ = nil;
  }
}

- (FIRReachabilityStatus)statusForFlags:(SCNetworkReachabilityFlags)flags {
  FIRReachabilityStatus status = kFIRReachabilityNotReachable;
  // If the Reachable flag is not set, we definitely don't have connectivity.
  if (flags & kSCNetworkReachabilityFlagsReachable) {
    // Reachable flag is set. Check further flags.
    if (!(flags & kSCNetworkReachabilityFlagsConnectionRequired)) {
// Connection required flag is not set, so we have connectivity.
#if TARGET_OS_IOS || TARGET_OS_TV
      status = (flags & kSCNetworkReachabilityFlagsIsWWAN) ? kFIRReachabilityViaCellular
                                                           : kFIRReachabilityViaWifi;
#elif TARGET_OS_OSX
      status = kFIRReachabilityViaWifi;
#endif
    } else if ((flags & (kSCNetworkReachabilityFlagsConnectionOnDemand |
                         kSCNetworkReachabilityFlagsConnectionOnTraffic)) &&
               !(flags & kSCNetworkReachabilityFlagsInterventionRequired)) {
// If the connection on demand or connection on traffic flag is set, and user intervention
// is not required, we have connectivity.
#if TARGET_OS_IOS || TARGET_OS_TV
      status = (flags & kSCNetworkReachabilityFlagsIsWWAN) ? kFIRReachabilityViaCellular
                                                           : kFIRReachabilityViaWifi;
#elif TARGET_OS_OSX
      status = kFIRReachabilityViaWifi;
#endif
    }
  }
  return status;
}

- (void)reachabilityFlagsChanged:(SCNetworkReachabilityFlags)flags {
  FIRReachabilityStatus status = [self statusForFlags:flags];
  if (reachabilityStatus_ != status) {
    NSString *reachabilityStatusString;
    if (status == kFIRReachabilityUnknown) {
      reachabilityStatusString = kFIRReachabilityUnknownStatus;
    } else {
      reachabilityStatusString = (status == kFIRReachabilityNotReachable)
                                     ? kFIRReachabilityDisconnectedStatus
                                     : kFIRReachabilityConnectedStatus;
    }
    [loggerDelegate_ firNetwork_logWithLevel:kFIRNetworkLogLevelDebug
                                 messageCode:kFIRNetworkMessageCodeReachabilityChecker004
                                     message:@"Network status has changed. Code, status"
                                    contexts:@[ @(status), reachabilityStatusString ]];
    reachabilityStatus_ = status;
    [reachabilityDelegate_ reachability:self statusChanged:reachabilityStatus_];
  }
}

@end

static void ReachabilityCallback(SCNetworkReachabilityRef reachability,
                                 SCNetworkReachabilityFlags flags,
                                 void *info) {
  FIRReachabilityChecker *checker = (__bridge FIRReachabilityChecker *)info;
  [checker reachabilityFlagsChanged:flags];
}

// This function used to be at the top of the file, but it was moved here
// as a workaround for a suspected compiler bug. When compiled in Release mode
// and run on an iOS device with WiFi disabled, the reachability code crashed
// when calling SCNetworkReachabilityScheduleWithRunLoop, or shortly thereafter.
// After unsuccessfully trying to diagnose the cause of the crash, it was
// discovered that moving this function to the end of the file magically fixed
// the crash. If you are going to edit this file, exercise caution and make sure
// to test thoroughly with an iOS device under various network conditions.
const NSString *FIRReachabilityStatusString(FIRReachabilityStatus status) {
  switch (status) {
    case kFIRReachabilityUnknown:
      return @"Reachability Unknown";

    case kFIRReachabilityNotReachable:
      return @"Not reachable";

    case kFIRReachabilityViaWifi:
      return @"Reachable via Wifi";

    case kFIRReachabilityViaCellular:
      return @"Reachable via Cellular Data";

    default:
      return [NSString stringWithFormat:@"Invalid reachability status %d", (int)status];
  }
}
