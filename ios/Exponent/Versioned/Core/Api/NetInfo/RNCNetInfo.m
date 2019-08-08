/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCNetInfo.h"

#if !TARGET_OS_TV
  #import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif
#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>

// Based on the ConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const RNCConnectionTypeUnknown = @"unknown";
static NSString *const RNCConnectionTypeNone = @"none";
static NSString *const RNCConnectionTypeWifi = @"wifi";
static NSString *const RNCConnectionTypeCellular = @"cellular";

// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const RNCCellularGeneration2g = @"2g";
static NSString *const RNCCellularGeneration3g = @"3g";
static NSString *const RNCCellularGeneration4g = @"4g";

@implementation RNCNetInfo
{
  SCNetworkReachabilityRef _firstTimeReachability;
  SCNetworkReachabilityRef _reachability;
  NSString *_connectionType;
  BOOL _connectionExpensive;
  NSString *_effectiveConnectionType;
  BOOL _isObserving;
  NSMutableSet<RCTPromiseResolveBlock> *_firstTimeReachabilityResolvers;
}

RCT_EXPORT_MODULE()

static void RNCReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  RNCNetInfo *self = (__bridge id)info;
  BOOL didSetReachabilityFlags = [self setReachabilityStatus:flags];

  if (self->_firstTimeReachability) {
    [self->_firstTimeReachabilityResolvers enumerateObjectsUsingBlock:^(RCTPromiseResolveBlock resolver, BOOL *stop) {
      resolver([self currentState]);
    }];

    [self cleanUpFirstTimeReachability];
    [self->_firstTimeReachabilityResolvers removeAllObjects];
  }

  if (didSetReachabilityFlags && self->_isObserving) {
    [self sendEventWithName:@"netInfo.networkStatusDidChange" body:[self currentState]];
  }
}

// We need RNCReachabilityCallback's and module methods to be called on the same thread so that we can have
// guarantees about when we mess with the reachability callbacks.
- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#pragma mark - Lifecycle

- (NSArray *)supportedEvents
{
  return @[@"netInfo.networkStatusDidChange"];
}

- (void)startObserving
{
  _isObserving = YES;
  _connectionType = RNCConnectionTypeUnknown;
  _effectiveConnectionType = nil;
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
  [self cleanUpFirstTimeReachability];
}

- (SCNetworkReachabilityRef)getReachabilityRef
{
  SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithName(kCFAllocatorDefault, "apple.com");
  SCNetworkReachabilityContext context = { 0, ( __bridge void *)self, NULL, NULL, NULL };
  SCNetworkReachabilitySetCallback(reachability, RNCReachabilityCallback, &context);
  SCNetworkReachabilityScheduleWithRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    
  return reachability;
}

- (BOOL)setReachabilityStatus:(SCNetworkReachabilityFlags)flags
{
  NSString *connectionType = RNCConnectionTypeUnknown;
  bool connectionExpensive = false;
  NSString *effectiveConnectionType = nil;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    connectionType = RNCConnectionTypeNone;
  }
  
#if !TARGET_OS_TV
  
  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    connectionType = RNCConnectionTypeCellular;
    connectionExpensive = true;
    
    CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
    if (netinfo) {
      if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyGPRS] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyEdge] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMA1x]) {
        effectiveConnectionType = RNCCellularGeneration2g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
        effectiveConnectionType = RNCCellularGeneration3g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
        effectiveConnectionType = RNCCellularGeneration4g;
      }
    }
  }
  
#endif
  
  else {
    connectionType = RNCConnectionTypeWifi;
  }
  
  if (![connectionType isEqualToString:self->_connectionType] ||
      ![effectiveConnectionType isEqualToString:self->_effectiveConnectionType]) {
    self->_connectionType = connectionType;
    self->_connectionExpensive = connectionExpensive;
    self->_effectiveConnectionType = effectiveConnectionType;
    return YES;
  }
  
  return NO;
}

- (void)cleanUpFirstTimeReachability
{
  if (_firstTimeReachability) {
    SCNetworkReachabilityUnscheduleFromRunLoop(self->_firstTimeReachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    CFRelease(self->_firstTimeReachability);
    _firstTimeReachability = nil;
  }
}

- (id)currentState
{
  NSString *connectionType = self->_connectionType ?: RNCConnectionTypeUnknown;
  NSString *effectiveConnectionType = self->_effectiveConnectionType;
  
  BOOL isConnected = ![connectionType isEqualToString:RNCConnectionTypeNone] && ![connectionType isEqualToString:RNCConnectionTypeUnknown];
  
  NSMutableDictionary *details = nil;
  if (isConnected) {
    details = [NSMutableDictionary new];
    details[@"isConnectionExpensive"] = @(self->_connectionExpensive ?: false);

    if ([connectionType isEqualToString:RNCConnectionTypeCellular]) {
      details[@"cellularGeneration"] = effectiveConnectionType ?: [NSNull null];
    }
  }
  
  return @{
           @"type": connectionType,
           @"isConnected": @(isConnected),
           @"details": details ?: [NSNull null]
           };
}

#pragma mark - Public API

RCT_EXPORT_METHOD(getCurrentState:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  // Setup the reacability listener if needed
  if (!_firstTimeReachability) {
    _firstTimeReachability = [self getReachabilityRef];
  }

  // Add our resolver to the set of those to be notified
  if (!_firstTimeReachabilityResolvers) {
    _firstTimeReachabilityResolvers = [NSMutableSet set];
  }
  [_firstTimeReachabilityResolvers addObject:resolve];
}

@end
