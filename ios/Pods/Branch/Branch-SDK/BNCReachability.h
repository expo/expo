//
//  BNCReachability.h
//  Branch
//
//  Created by Ernest Cho on 11/18/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Handles network connectivity and type information
@interface BNCReachability : NSObject

+ (BNCReachability *)shared;

- (nullable NSString *)reachabilityStatus;

@end

NS_ASSUME_NONNULL_END
