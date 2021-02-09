//
//  BNCReachability.m
//  Branch
//
//  Created by Ernest Cho on 11/18/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCReachability.h"
#import <netinet/in.h>
#import <SystemConfiguration/SystemConfiguration.h>

typedef NS_ENUM(NSInteger, BNCNetworkStatus) {
    BNCNetworkStatusNotReachable,
    BNCNetworkStatusReachableViaWiFi,
    BNCNetworkStatusReachableViaWWAN
};

@interface BNCReachability()
@property (nonatomic, assign, readwrite) SCNetworkReachabilityRef reachability;
@end

/**
 Based on Apple's Reachability Sample
 
 @link https://developer.apple.com/library/archive/samplecode/Reachability/Introduction/Intro.html
 */
@implementation BNCReachability

+ (BNCReachability *)shared {
    static BNCReachability *reachability;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        reachability = [BNCReachability new];
    });
    return reachability;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        [self setupForInternet];
    }
    return self;
}

- (void)setupForInternet {
    struct sockaddr_in zeroAddress;
    bzero(&zeroAddress, sizeof(zeroAddress));
    zeroAddress.sin_len = sizeof(zeroAddress);
    zeroAddress.sin_family = AF_INET;
    
    self.reachability = SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault,  (const struct sockaddr *) &zeroAddress);
}

- (BNCNetworkStatus)networkStatusForFlags:(SCNetworkReachabilityFlags)flags {
    
    // The target host is not reachable.
    if ((flags & kSCNetworkReachabilityFlagsReachable) == 0) {
        return BNCNetworkStatusNotReachable;
    }

    BNCNetworkStatus status = BNCNetworkStatusNotReachable;

    // If the target host is reachable and no connection is required then we'll assume (for now) that you're on Wi-Fi...
    if ((flags & kSCNetworkReachabilityFlagsConnectionRequired) == 0) {
        status = BNCNetworkStatusReachableViaWiFi;
    }

    // and the connection is on-demand (or on-traffic) if the calling application is using the CFSocketStream or higher APIs...
    if ((((flags & kSCNetworkReachabilityFlagsConnectionOnDemand ) != 0) || (flags & kSCNetworkReachabilityFlagsConnectionOnTraffic) != 0)) {
        // and no [user] intervention is needed...
        if ((flags & kSCNetworkReachabilityFlagsInterventionRequired) == 0) {
            status = BNCNetworkStatusReachableViaWiFi;
        }
    }

    // but WWAN connections are OK if the calling application is using the CFNetwork APIs.
    if ((flags & kSCNetworkReachabilityFlagsIsWWAN) == kSCNetworkReachabilityFlagsIsWWAN) {
        status = BNCNetworkStatusReachableViaWWAN;
    }
    
    return status;
}

- (BNCNetworkStatus)currentReachabilityStatus {
    BNCNetworkStatus status = BNCNetworkStatusNotReachable;
    if (self.reachability) {
        SCNetworkReachabilityFlags flags;
        if (SCNetworkReachabilityGetFlags(self.reachability, &flags)) {
            status = [self networkStatusForFlags:flags];
        }
    }
    return status;
}

// Translates the enum into a string the server accepts
- (nullable NSString *)translateReachabilityStatus:(BNCNetworkStatus)status {
    switch(status) {
        case BNCNetworkStatusReachableViaWiFi:
            return @"wifi";
        case BNCNetworkStatusReachableViaWWAN:
            return @"mobile";
        default:
            return nil;
    }
}

- (nullable NSString *)reachabilityStatus {
    return [self translateReachabilityStatus:[self currentReachabilityStatus]];
}

- (void)dealloc {
    if (self.reachability) {
        CFRelease(self.reachability);
        self.reachability = nil;
    }
}

@end
