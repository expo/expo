/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTNetInfo.h"

#if !TARGET_OS_TV
  #import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif
#import <ReactABI28_0_0/ABI28_0_0RCTAssert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>

// Based on the ConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const ABI28_0_0RCTConnectionTypeUnknown = @"unknown";
static NSString *const ABI28_0_0RCTConnectionTypeNone = @"none";
static NSString *const ABI28_0_0RCTConnectionTypeWifi = @"wifi";
static NSString *const ABI28_0_0RCTConnectionTypeCellular = @"cellular";

// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const ABI28_0_0RCTEffectiveConnectionTypeUnknown = @"unknown";
static NSString *const ABI28_0_0RCTEffectiveConnectionType2g = @"2g";
static NSString *const ABI28_0_0RCTEffectiveConnectionType3g = @"3g";
static NSString *const ABI28_0_0RCTEffectiveConnectionType4g = @"4g";

// The ABI28_0_0RCTReachabilityState* values are deprecated.
static NSString *const ABI28_0_0RCTReachabilityStateUnknown = @"unknown";
static NSString *const ABI28_0_0RCTReachabilityStateNone = @"none";
static NSString *const ABI28_0_0RCTReachabilityStateWifi = @"wifi";
static NSString *const ABI28_0_0RCTReachabilityStateCell = @"cell";

@implementation ABI28_0_0RCTNetInfo
{
  SCNetworkReachabilityRef _reachability;
  NSString *_connectionType;
  NSString *_effectiveConnectionType;
  NSString *_statusDeprecated;
  NSString *_host;
  BOOL _isObserving;
}

ABI28_0_0RCT_EXPORT_MODULE()

static void ABI28_0_0RCTReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  ABI28_0_0RCTNetInfo *self = (__bridge id)info;
  if ([self setReachabilityStatus:flags] && self->_isObserving) {
    [self sendEventWithName:@"networkStatusDidChange" body:@{@"connectionType": self->_connectionType,
                                                             @"effectiveConnectionType": self->_effectiveConnectionType,
                                                             @"network_info": self->_statusDeprecated}];
  }
}

#pragma mark - Lifecycle

- (instancetype)initWithHost:(NSString *)host
{
  ABI28_0_0RCTAssertParam(host);
  ABI28_0_0RCTAssert(![host hasPrefix:@"http"], @"Host value should just contain the domain, not the URL scheme.");

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
  _isObserving = YES;
  _connectionType = ABI28_0_0RCTConnectionTypeUnknown;
  _effectiveConnectionType = ABI28_0_0RCTEffectiveConnectionTypeUnknown;
  _statusDeprecated = ABI28_0_0RCTReachabilityStateUnknown;
  _reachability = [self getReachabilityRef];
}

- (void)stopObserving
{
  _isObserving = NO;
  if (_reachability) {
    SCNetworkReachabilityUnscheduleFromRunLoop(_reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    CFRelease(_reachability);
  }
}

- (SCNetworkReachabilityRef)getReachabilityRef
{
  SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithName(kCFAllocatorDefault, _host.UTF8String ?: "apple.com");
  SCNetworkReachabilityContext context = { 0, ( __bridge void *)self, NULL, NULL, NULL };
  SCNetworkReachabilitySetCallback(reachability, ABI28_0_0RCTReachabilityCallback, &context);
  SCNetworkReachabilityScheduleWithRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    
  return reachability;
}

- (BOOL)setReachabilityStatus:(SCNetworkReachabilityFlags)flags
{
  NSString *connectionType = ABI28_0_0RCTConnectionTypeUnknown;
  NSString *effectiveConnectionType = ABI28_0_0RCTEffectiveConnectionTypeUnknown;
  NSString *status = ABI28_0_0RCTReachabilityStateUnknown;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    connectionType = ABI28_0_0RCTConnectionTypeNone;
    status = ABI28_0_0RCTReachabilityStateNone;
  }
  
#if !TARGET_OS_TV
  
  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    connectionType = ABI28_0_0RCTConnectionTypeCellular;
    status = ABI28_0_0RCTReachabilityStateCell;
    
    CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
    if (netinfo) {
      if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyGPRS] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyEdge] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMA1x]) {
        effectiveConnectionType = ABI28_0_0RCTEffectiveConnectionType2g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
        effectiveConnectionType = ABI28_0_0RCTEffectiveConnectionType3g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
        effectiveConnectionType = ABI28_0_0RCTEffectiveConnectionType4g;
      }
    }
  }
  
#endif
  
  else {
    connectionType = ABI28_0_0RCTConnectionTypeWifi;
    status = ABI28_0_0RCTReachabilityStateWifi;
  }
  
  if (![connectionType isEqualToString:self->_connectionType] ||
      ![effectiveConnectionType isEqualToString:self->_effectiveConnectionType] ||
      ![status isEqualToString:self->_statusDeprecated]) {
    self->_connectionType = connectionType;
    self->_effectiveConnectionType = effectiveConnectionType;
    self->_statusDeprecated = status;
    return YES;
  }
  
  return NO;
}

#pragma mark - Public API

ABI28_0_0RCT_EXPORT_METHOD(getCurrentConnectivity:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI28_0_0RCTPromiseRejectBlock)reject)
{
  SCNetworkReachabilityRef reachability = [self getReachabilityRef];
  SCNetworkReachabilityUnscheduleFromRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
  CFRelease(reachability);
  resolve(@{@"connectionType": _connectionType ?: ABI28_0_0RCTConnectionTypeUnknown,
            @"effectiveConnectionType": _effectiveConnectionType ?: ABI28_0_0RCTEffectiveConnectionTypeUnknown,
            @"network_info": _statusDeprecated ?: ABI28_0_0RCTReachabilityStateUnknown});
}

@end
