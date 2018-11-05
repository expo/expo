/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTNetInfo.h"

#if !TARGET_OS_TV
  #import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif
#import <ReactABI26_0_0/ABI26_0_0RCTAssert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventDispatcher.h>

// Based on the ConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const ABI26_0_0RCTConnectionTypeUnknown = @"unknown";
static NSString *const ABI26_0_0RCTConnectionTypeNone = @"none";
static NSString *const ABI26_0_0RCTConnectionTypeWifi = @"wifi";
static NSString *const ABI26_0_0RCTConnectionTypeCellular = @"cellular";

// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const ABI26_0_0RCTEffectiveConnectionTypeUnknown = @"unknown";
static NSString *const ABI26_0_0RCTEffectiveConnectionType2g = @"2g";
static NSString *const ABI26_0_0RCTEffectiveConnectionType3g = @"3g";
static NSString *const ABI26_0_0RCTEffectiveConnectionType4g = @"4g";

// The ABI26_0_0RCTReachabilityState* values are deprecated.
static NSString *const ABI26_0_0RCTReachabilityStateUnknown = @"unknown";
static NSString *const ABI26_0_0RCTReachabilityStateNone = @"none";
static NSString *const ABI26_0_0RCTReachabilityStateWifi = @"wifi";
static NSString *const ABI26_0_0RCTReachabilityStateCell = @"cell";

@implementation ABI26_0_0RCTNetInfo
{
  SCNetworkReachabilityRef _reachability;
  NSString *_connectionType;
  NSString *_effectiveConnectionType;
  NSString *_statusDeprecated;
  NSString *_host;
}

ABI26_0_0RCT_EXPORT_MODULE()

static void ABI26_0_0RCTReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  ABI26_0_0RCTNetInfo *self = (__bridge id)info;
  NSString *connectionType = ABI26_0_0RCTConnectionTypeUnknown;
  NSString *effectiveConnectionType = ABI26_0_0RCTEffectiveConnectionTypeUnknown;
  NSString *status = ABI26_0_0RCTReachabilityStateUnknown;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    connectionType = ABI26_0_0RCTConnectionTypeNone;
    status = ABI26_0_0RCTReachabilityStateNone;
  }
  
#if !TARGET_OS_TV
  
  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    connectionType = ABI26_0_0RCTConnectionTypeCellular;
    status = ABI26_0_0RCTReachabilityStateCell;
    
    CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
    if (netinfo) {
      if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyGPRS] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyEdge] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMA1x]) {
        effectiveConnectionType = ABI26_0_0RCTEffectiveConnectionType2g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
        effectiveConnectionType = ABI26_0_0RCTEffectiveConnectionType3g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
        effectiveConnectionType = ABI26_0_0RCTEffectiveConnectionType4g;
      }
    }
  }
  
#endif
  
  else {
    connectionType = ABI26_0_0RCTConnectionTypeWifi;
    status = ABI26_0_0RCTReachabilityStateWifi;
  }
  
  if (![connectionType isEqualToString:self->_connectionType] ||
      ![effectiveConnectionType isEqualToString:self->_effectiveConnectionType] ||
      ![status isEqualToString:self->_statusDeprecated]) {
    self->_connectionType = connectionType;
    self->_effectiveConnectionType = effectiveConnectionType;
    self->_statusDeprecated = status;
    [self sendEventWithName:@"networkStatusDidChange" body:@{@"connectionType": connectionType,
                                                             @"effectiveConnectionType": effectiveConnectionType,
                                                             @"network_info": status}];
  }
}

#pragma mark - Lifecycle

- (instancetype)initWithHost:(NSString *)host
{
  ABI26_0_0RCTAssertParam(host);
  ABI26_0_0RCTAssert(![host hasPrefix:@"http"], @"Host value should just contain the domain, not the URL scheme.");

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
  _connectionType = ABI26_0_0RCTConnectionTypeUnknown;
  _effectiveConnectionType = ABI26_0_0RCTEffectiveConnectionTypeUnknown;
  _statusDeprecated = ABI26_0_0RCTReachabilityStateUnknown;
  _reachability = SCNetworkReachabilityCreateWithName(kCFAllocatorDefault, _host.UTF8String ?: "apple.com");
  SCNetworkReachabilityContext context = { 0, ( __bridge void *)self, NULL, NULL, NULL };
  SCNetworkReachabilitySetCallback(_reachability, ABI26_0_0RCTReachabilityCallback, &context);
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

ABI26_0_0RCT_EXPORT_METHOD(getCurrentConnectivity:(ABI26_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@{@"connectionType": _connectionType ?: ABI26_0_0RCTConnectionTypeUnknown,
            @"effectiveConnectionType": _effectiveConnectionType ?: ABI26_0_0RCTEffectiveConnectionTypeUnknown,
            @"network_info": _statusDeprecated ?: ABI26_0_0RCTReachabilityStateUnknown});
}

@end
