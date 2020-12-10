//
//  BNCNetworkInterface.h
//  Branch
//
//  Created by Ernest Cho on 11/19/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Handles local ip address lookup
@interface BNCNetworkInterface : NSObject

+ (nullable NSString *)localIPAddress;

+ (NSArray<NSString *> *)allIPAddresses;

@end

NS_ASSUME_NONNULL_END
