/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <SystemConfiguration/SystemConfiguration.h>

NS_ASSUME_NONNULL_BEGIN

// Based on the ConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const RNCConnectionTypeUnknown = @"unknown";
static NSString *const RNCConnectionTypeNone = @"none";
static NSString *const RNCConnectionTypeWifi = @"wifi";
static NSString *const RNCConnectionTypeCellular = @"cellular";
static NSString *const RNCConnectionTypeEthernet = @"ethernet";

// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const RNCCellularGeneration2g = @"2g";
static NSString *const RNCCellularGeneration3g = @"3g";
static NSString *const RNCCellularGeneration4g = @"4g";

@interface RNCConnectionState : NSObject

- (instancetype)init;
- (instancetype)initWithReachabilityFlags:(SCNetworkReachabilityFlags)flags;
- (BOOL)isEqualToConnectionState:(RNCConnectionState *)otherState;

@property (nonatomic, strong, readonly) NSString *type;
@property (nullable, nonatomic, strong, readonly) NSString *cellularGeneration;
@property (nonatomic, readonly) BOOL connected;
@property (nonatomic, readonly) BOOL expensive;

@end

NS_ASSUME_NONNULL_END
