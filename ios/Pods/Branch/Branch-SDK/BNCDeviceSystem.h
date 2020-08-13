//
//  BNCDeviceSystem.h
//  Branch
//
//  Created by Ernest Cho on 11/14/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface BNCDeviceSystem : NSObject

// Build info from the Software Version
// "iOS 13.2.2 (17B102)" would return "17B102"
@property (nonatomic, copy, readwrite) NSString *systemBuildVersion;

// Machine type information
// "x86_64" on simulator
// "iPad7,5" on iPad (2018)
@property (nonatomic, copy, readwrite) NSString *machine;

// CPU type information
// See mach/machine.h for details
@property (nonatomic, copy, readwrite) NSNumber *cpuType;
@property (nonatomic, copy, readwrite) NSNumber *cpuSubType;

@end

NS_ASSUME_NONNULL_END
