/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTNetInfo.h"

#import <ReactABI15_0_0/ABI15_0_0RCTAssert.h>
#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>
#import <ReactABI15_0_0/ABI15_0_0RCTEventDispatcher.h>

static NSString *const ABI15_0_0RCTReachabilityStateUnknown = @"unknown";
static NSString *const ABI15_0_0RCTReachabilityStateNone = @"none";
static NSString *const ABI15_0_0RCTReachabilityStateWifi = @"wifi";
static NSString *const ABI15_0_0RCTReachabilityStateCell = @"cell";

@implementation ABI15_0_0RCTNetInfo
{
  SCNetworkReachabilityRef _reachability;
  NSString *_status;
  NSString *_host;
}

ABI15_0_0RCT_EXPORT_MODULE()

static void ABI15_0_0RCTReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  ABI15_0_0RCTNetInfo *self = (__bridge id)info;
  NSString *status = ABI15_0_0RCTReachabilityStateUnknown;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    status = ABI15_0_0RCTReachabilityStateNone;
  }

#if TARGET_OS_IPHONE

  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    status = ABI15_0_0RCTReachabilityStateCell;
  }

#endif

  else {
    status = ABI15_0_0RCTReachabilityStateWifi;
  }

  if (![status isEqualToString:self->_status]) {
    self->_status = status;
    [self sendEventWithName:@"networkStatusDidChange" body:@{@"network_info": status}];
  }
}

#pragma mark - Lifecycle

- (instancetype)initWithHost:(NSString *)host
{
  ABI15_0_0RCTAssertParam(host);
  ABI15_0_0RCTAssert(![host hasPrefix:@"http"], @"Host value should just contain the domain, not the URL scheme.");

  if ((self = [self init])) {
    _host = [host copy];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"networkStatusDidChange"];
}

- (void)startObserving
{
  _status = ABI15_0_0RCTReachabilityStateUnknown;
  _reachability = SCNetworkReachabilityCreateWithName(kCFAllocatorDefault, _host.UTF8String ?: "apple.com");
  SCNetworkReachabilityContext context = { 0, ( __bridge void *)self, NULL, NULL, NULL };
  SCNetworkReachabilitySetCallback(_reachability, ABI15_0_0RCTReachabilityCallback, &context);
  SCNetworkReachabilityScheduleWithRunLoop(_reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
}

- (void)stopObserving
{
  if (_reachability) {
    SCNetworkReachabilityUnscheduleFromRunLoop(_reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    CFRelease(_reachability);
  }
}

#pragma mark - Public API

ABI15_0_0RCT_EXPORT_METHOD(getCurrentConnectivity:(ABI15_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI15_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@{@"network_info": _status ?: ABI15_0_0RCTReachabilityStateUnknown});
}

@end
