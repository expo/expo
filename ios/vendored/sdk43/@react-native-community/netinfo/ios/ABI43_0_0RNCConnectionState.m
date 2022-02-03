/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNCConnectionState.h"
#if !TARGET_OS_TV
#import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif

#if TARGET_OS_TV || TARGET_OS_OSX
#include <ifaddrs.h>
#endif

@implementation ABI43_0_0RNCConnectionState

// Creates a new "blank" state
- (instancetype)init
{
    self = [super init];
    if (self) {
        _type = ABI43_0_0RNCConnectionTypeUnknown;
        _cellularGeneration = nil;
        _expensive = false;
    }
    return self;
}

// Creates the state from the given reachability references
- (instancetype)initWithReachabilityFlags:(SCNetworkReachabilityFlags)flags
{
    self = [self init];
    if (self) {
        _type = ABI43_0_0RNCConnectionTypeUnknown;
        _cellularGeneration = nil;
        _expensive = false;
        
        if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
            (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
            _type = ABI43_0_0RNCConnectionTypeNone;
        }
#if !TARGET_OS_TV && !TARGET_OS_OSX
        else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
            _type = ABI43_0_0RNCConnectionTypeCellular;
            _expensive = true;
            
            CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
            if (netinfo) {
                if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyGPRS] ||
                    [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyEdge] ||
                    [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMA1x]) {
                    _cellularGeneration = ABI43_0_0RNCCellularGeneration2g;
                } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
                           [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
                           [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
                           [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
                           [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
                           [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
                           [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
                    _cellularGeneration = ABI43_0_0RNCCellularGeneration3g;
                } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
                    _cellularGeneration = ABI43_0_0RNCCellularGeneration4g;
                }
            }
        }
#endif
        else {
            _type = ABI43_0_0RNCConnectionTypeWifi;
#if TARGET_OS_TV || TARGET_OS_OSX
            struct ifaddrs *interfaces = NULL;
            struct ifaddrs *temp_addr = NULL;
            int success = 0;
            // retrieve the current interfaces - returns 0 on success
            success = getifaddrs(&interfaces);
            if (success == 0) {
                // Loop through linked list of interfaces
                temp_addr = interfaces;
                while (temp_addr != NULL) {
                    if (temp_addr->ifa_addr->sa_family == AF_INET) {
                        // Check if interface is en0 which is the ethernet connection on the Apple TV
                        NSString* ifname = [NSString stringWithUTF8String:temp_addr->ifa_name];
                        if ([ifname isEqualToString:@"en0"]) {
                            _type = ABI43_0_0RNCConnectionTypeEthernet;
                        }
                    }
                    temp_addr = temp_addr->ifa_next;
                }
            }
            // Free memory
            freeifaddrs(interfaces);
#endif
        }
    }
    return self;
}

// Checks if two states are equal
- (BOOL)isEqualToConnectionState:(ABI43_0_0RNCConnectionState *)otherState
{
    return [self.type isEqualToString:otherState.type]
            && [self.cellularGeneration isEqualToString:otherState.cellularGeneration]
            && self.expensive == otherState.expensive;
}

- (BOOL)connected
{
    return ![self.type isEqualToString:ABI43_0_0RNCConnectionTypeNone] && ![self.type isEqualToString:ABI43_0_0RNCConnectionTypeUnknown];
}

@end
