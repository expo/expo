/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNCNetInfo.h"

#if !TARGET_OS_TV
  #import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif
#import <ReactABI34_0_0/ABI34_0_0RCTAssert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventDispatcher.h>

// Based on the ConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const ABI34_0_0RNCConnectionTypeUnknown = @"unknown";
static NSString *const ABI34_0_0RNCConnectionTypeNone = @"none";
static NSString *const ABI34_0_0RNCConnectionTypeWifi = @"wifi";
static NSString *const ABI34_0_0RNCConnectionTypeCellular = @"cellular";

// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const ABI34_0_0RNCCellularGeneration2g = @"2g";
static NSString *const ABI34_0_0RNCCellularGeneration3g = @"3g";
static NSString *const ABI34_0_0RNCCellularGeneration4g = @"4g";

@implementation ABI34_0_0RNCNetInfo
{
  SCNetworkReachabilityRef _firstTimeReachability;
  SCNetworkReachabilityRef _reachability;
  NSString *_connectionType;
  BOOL _connectionExpensive;
  NSString *_effectiveConnectionType;
  BOOL _isObserving;
  NSMutableSet<ABI34_0_0RCTPromiseResolveBlock> *_firstTimeReachabilityResolvers;
}

ABI34_0_0RCT_EXPORT_MODULE()

static void ABI34_0_0RNCReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  ABI34_0_0RNCNetInfo *self = (__bridge id)info;
  BOOL didSetReachabilityFlags = [self setReachabilityStatus:flags];

  if (self->_firstTimeReachability) {
    [self->_firstTimeReachabilityResolvers enumerateObjectsUsingBlock:^(ABI34_0_0RCTPromiseResolveBlock resolver, BOOL *stop) {
      resolver([self currentState]);
    }];

    [self cleanUpFirstTimeReachability];
    [self->_firstTimeReachabilityResolvers removeAllObjects];
  }

  if (didSetReachabilityFlags && self->_isObserving) {
    [self sendEventWithName:@"netInfo.networkStatusDidChange" body:[self currentState]];
  }
}

// We need ABI34_0_0RNCReachabilityCallback's and module methods to be called on the same thread so that we can have
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
  _connectionType = ABI34_0_0RNCConnectionTypeUnknown;
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
  SCNetworkReachabilitySetCallback(reachability, ABI34_0_0RNCReachabilityCallback, &context);
  SCNetworkReachabilityScheduleWithRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    
  return reachability;
}

- (BOOL)setReachabilityStatus:(SCNetworkReachabilityFlags)flags
{
  NSString *connectionType = ABI34_0_0RNCConnectionTypeUnknown;
  bool connectionExpensive = false;
  NSString *effectiveConnectionType = nil;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    connectionType = ABI34_0_0RNCConnectionTypeNone;
  }
  
#if !TARGET_OS_TV
  
  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    connectionType = ABI34_0_0RNCConnectionTypeCellular;
    connectionExpensive = true;
    
    CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
    if (netinfo) {
      if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyGPRS] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyEdge] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMA1x]) {
        effectiveConnectionType = ABI34_0_0RNCCellularGeneration2g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
        effectiveConnectionType = ABI34_0_0RNCCellularGeneration3g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
        effectiveConnectionType = ABI34_0_0RNCCellularGeneration4g;
      }
    }
  }
  
#endif
  
  else {
    connectionType = ABI34_0_0RNCConnectionTypeWifi;
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
  NSString *connectionType = self->_connectionType ?: ABI34_0_0RNCConnectionTypeUnknown;
  NSString *effectiveConnectionType = self->_effectiveConnectionType;
  
  BOOL isConnected = ![connectionType isEqualToString:ABI34_0_0RNCConnectionTypeNone] && ![connectionType isEqualToString:ABI34_0_0RNCConnectionTypeUnknown];
  
  NSMutableDictionary *details = nil;
  if (isConnected) {
    details = [NSMutableDictionary new];
    details[@"isConnectionExpensive"] = @(self->_connectionExpensive ?: false);

    if ([connectionType isEqualToString:ABI34_0_0RNCConnectionTypeCellular]) {
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

ABI34_0_0RCT_EXPORT_METHOD(getCurrentState:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI34_0_0RCTPromiseRejectBlock)reject)
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
