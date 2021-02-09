//
//  BNCNetworkInterface.m
//  Branch
//
//  Created by Ernest Cho on 11/19/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCNetworkInterface.h"
#import "BNCLog.h"

#import <net/if.h>
#import <ifaddrs.h>
#import <arpa/inet.h>
#import <netinet/in.h>

typedef NS_ENUM(NSInteger, BNCNetworkAddressType) {
    BNCNetworkAddressTypeUnknown = 0,
    BNCNetworkAddressTypeIPv4,
    BNCNetworkAddressTypeIPv6
};

@interface BNCNetworkInterface()

@property (nonatomic, copy, readwrite) NSString *interfaceName;
@property (nonatomic, assign, readwrite) BNCNetworkAddressType addressType;
@property (nonatomic, copy, readwrite) NSString *address;

+ (NSArray<BNCNetworkInterface *> *)currentInterfaces;

@end

@implementation BNCNetworkInterface

- (NSString*) description {
    return [NSString stringWithFormat:@"<%@ %p %@ %@>",
        NSStringFromClass(self.class),
        self,
        self.interfaceName,
        self.address
    ];
}

+ (NSArray<BNCNetworkInterface *> *)currentInterfaces {

    struct ifaddrs *interfaces = NULL;
    NSMutableArray *currentInterfaces = [NSMutableArray arrayWithCapacity:8];

    // Retrieve the current interfaces - returns 0 on success
    if (getifaddrs(&interfaces) != 0) {
        int e = errno;
        BNCLogError(@"Can't read ip address: (%d): %s.", e, strerror(e));
        goto exit;
    }

    // Loop through linked list of interfaces --
    struct ifaddrs *interface = NULL;
    for (interface=interfaces; interface; interface=interface->ifa_next) {
        
        // BNCLogDebugSDK(@"Found %s: %x.", interface->ifa_name, interface->ifa_flags);
        
        // Check the state: IFF_RUNNING, IFF_UP, IFF_LOOPBACK, etc.
        if ((interface->ifa_flags & IFF_UP) && (interface->ifa_flags & IFF_RUNNING) && !(interface->ifa_flags & IFF_LOOPBACK)) {
        } else {
            continue;
        }

        // TODO: Check ifdata too.
        // struct if_data *ifdata = interface->ifa_data;

        const struct sockaddr_in *addr = (const struct sockaddr_in*)interface->ifa_addr;
        if (!addr) continue;

        BNCNetworkAddressType type = BNCNetworkAddressTypeUnknown;
        char addrBuf[MAX(INET_ADDRSTRLEN, INET6_ADDRSTRLEN)];

        if (addr->sin_family == AF_INET) {
            if (inet_ntop(AF_INET, &addr->sin_addr, addrBuf, INET_ADDRSTRLEN)) {
                type = BNCNetworkAddressTypeIPv4;
            }
        } else if (addr->sin_family == AF_INET6) {
            const struct sockaddr_in6 *addr6 = (const struct sockaddr_in6*)interface->ifa_addr;
            if (inet_ntop(AF_INET6, &addr6->sin6_addr, addrBuf, INET6_ADDRSTRLEN)) {
                type = BNCNetworkAddressTypeIPv6;
            }
        } else {
            continue;
        }

        NSString *name = [NSString stringWithUTF8String:interface->ifa_name];
        if (name && type != BNCNetworkAddressTypeUnknown) {
            BNCNetworkInterface *interface = [BNCNetworkInterface new];
            interface.interfaceName = name;
            interface.addressType = type;
            interface.address = [NSString stringWithUTF8String:addrBuf];
            [currentInterfaces addObject:interface];
        }
    }

exit:
    if (interfaces) freeifaddrs(interfaces);
    return currentInterfaces;
}

+ (nullable NSString *)localIPAddress {
    NSArray<BNCNetworkInterface *> *interfaces = [BNCNetworkInterface currentInterfaces];
    for (BNCNetworkInterface *interface in interfaces) {
        if (interface.addressType == BNCNetworkAddressTypeIPv4) {
            return interface.address;
        }
    }
    return nil;
}

+ (NSArray<NSString *> *)allIPAddresses {
    NSMutableArray *array = [NSMutableArray new];
    for (BNCNetworkInterface *inf in [BNCNetworkInterface currentInterfaces]) {
        if (inf.description) {
            [array addObject:inf.description];
        }
    }
    return array;
}

@end
