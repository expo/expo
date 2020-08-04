/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTNetInfo.h>

#if !TARGET_OS_TV && !TARGET_OS_UIKITFORMAC
  #import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif
#import <ABI37_0_0React/ABI37_0_0RCTAssert.h>
#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>

// Based on the ConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const ABI37_0_0RCTConnectionTypeUnknown = @"unknown";
static NSString *const ABI37_0_0RCTConnectionTypeNone = @"none";
static NSString *const ABI37_0_0RCTConnectionTypeWifi = @"wifi";
static NSString *const ABI37_0_0RCTConnectionTypeCellular = @"cellular";

// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const ABI37_0_0RCTEffectiveConnectionTypeUnknown = @"unknown";
static NSString *const ABI37_0_0RCTEffectiveConnectionType2g = @"2g";
static NSString *const ABI37_0_0RCTEffectiveConnectionType3g = @"3g";
static NSString *const ABI37_0_0RCTEffectiveConnectionType4g = @"4g";

// The ABI37_0_0RCTReachabilityState* values are deprecated.
static NSString *const ABI37_0_0RCTReachabilityStateUnknown = @"unknown";
static NSString *const ABI37_0_0RCTReachabilityStateNone = @"none";
static NSString *const ABI37_0_0RCTReachabilityStateWifi = @"wifi";
static NSString *const ABI37_0_0RCTReachabilityStateCell = @"cell";

@implementation ABI37_0_0RCTNetInfo
{
  SCNetworkReachabilityRef _firstTimeReachability;
  SCNetworkReachabilityRef _reachability;
  NSString *_connectionType;
  NSString *_effectiveConnectionType;
  NSString *_statusDeprecated;
  NSString *_host;
  BOOL _isObserving;
  ABI37_0_0RCTPromiseResolveBlock _resolve;
}

ABI37_0_0RCT_EXPORT_MODULE()

static void ABI37_0_0RCTReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  ABI37_0_0RCTNetInfo *self = (__bridge id)info;
  BOOL didSetReachabilityFlags = [self setReachabilityStatus:flags];
  
  NSString *connectionType = self->_connectionType ?: ABI37_0_0RCTConnectionTypeUnknown;
  NSString *effectiveConnectionType = self->_effectiveConnectionType ?: ABI37_0_0RCTEffectiveConnectionTypeUnknown;
  NSString *networkInfo = self->_statusDeprecated ?: ABI37_0_0RCTReachabilityStateUnknown;

  if (self->_firstTimeReachability && self->_resolve) {
    SCNetworkReachabilityUnscheduleFromRunLoop(self->_firstTimeReachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    CFRelease(self->_firstTimeReachability);
    self->_resolve(@{@"connectionType": connectionType,
                     @"effectiveConnectionType": effectiveConnectionType,
                     @"network_info": networkInfo});
    self->_firstTimeReachability = nil;
    self->_resolve = nil;
  }

  if (didSetReachabilityFlags && self->_isObserving) {
    [self sendEventWithName:@"networkStatusDidChange" body:@{@"connectionType": connectionType,
                                                             @"effectiveConnectionType": effectiveConnectionType,
                                                             @"network_info": networkInfo}];
  }
}

// We need ABI37_0_0RCTReachabilityCallback's and module methods to be called on the same thread so that we can have
// guarantees about when we mess with the reachability callbacks.
- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#pragma mark - Lifecycle

- (instancetype)initWithHost:(NSString *)host
{
  ABI37_0_0RCTAssertParam(host);
  ABI37_0_0RCTAssert(![host hasPrefix:@"http"], @"Host value should just contain the domain, not the URL scheme.");

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
  _connectionType = ABI37_0_0RCTConnectionTypeUnknown;
  _effectiveConnectionType = ABI37_0_0RCTEffectiveConnectionTypeUnknown;
  _statusDeprecated = ABI37_0_0RCTReachabilityStateUnknown;
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

- (void)dealloc
{
  if (_firstTimeReachability) {
    SCNetworkReachabilityUnscheduleFromRunLoop(self->_firstTimeReachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    CFRelease(self->_firstTimeReachability);
    _firstTimeReachability = nil;
    _resolve = nil;
  }
}

- (SCNetworkReachabilityRef)getReachabilityRef
{
  SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithName(kCFAllocatorDefault, _host.UTF8String ?: "apple.com");
  SCNetworkReachabilityContext context = { 0, ( __bridge void *)self, NULL, NULL, NULL };
  SCNetworkReachabilitySetCallback(reachability, ABI37_0_0RCTReachabilityCallback, &context);
  SCNetworkReachabilityScheduleWithRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    
  return reachability;
}

- (BOOL)setReachabilityStatus:(SCNetworkReachabilityFlags)flags
{
  NSString *connectionType = ABI37_0_0RCTConnectionTypeUnknown;
  NSString *effectiveConnectionType = ABI37_0_0RCTEffectiveConnectionTypeUnknown;
  NSString *status = ABI37_0_0RCTReachabilityStateUnknown;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    connectionType = ABI37_0_0RCTConnectionTypeNone;
    status = ABI37_0_0RCTReachabilityStateNone;
  }
  
#if !TARGET_OS_TV && !TARGET_OS_UIKITFORMAC
  
  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    connectionType = ABI37_0_0RCTConnectionTypeCellular;
    status = ABI37_0_0RCTReachabilityStateCell;
    
    CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
    if (netinfo) {
      if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyGPRS] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyEdge] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMA1x]) {
        effectiveConnectionType = ABI37_0_0RCTEffectiveConnectionType2g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
        effectiveConnectionType = ABI37_0_0RCTEffectiveConnectionType3g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
        effectiveConnectionType = ABI37_0_0RCTEffectiveConnectionType4g;
      }
    }
  }
  
#endif
  
  else {
    connectionType = ABI37_0_0RCTConnectionTypeWifi;
    status = ABI37_0_0RCTReachabilityStateWifi;
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

ABI37_0_0RCT_EXPORT_METHOD(getCurrentConnectivity:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI37_0_0RCTPromiseRejectBlock)reject)
{
  if (_firstTimeReachability) {
    SCNetworkReachabilityUnscheduleFromRunLoop(self->_firstTimeReachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    CFRelease(self->_firstTimeReachability);
    _firstTimeReachability = nil;
    _resolve = nil;
  }
  _firstTimeReachability = [self getReachabilityRef];
  _resolve = resolve;
}

@end
