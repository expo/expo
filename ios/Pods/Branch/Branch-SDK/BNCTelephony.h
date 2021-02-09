//
//  BNCTelephony.h
//  Branch
//
//  Created by Ernest Cho on 11/14/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// General country, carrier level information from CoreTelephony
@interface BNCTelephony : NSObject

// Example: "AT&T"
@property (nonatomic, copy, nullable) NSString *carrierName;

// Example: "us"
@property (nonatomic, copy, nullable) NSString *isoCountryCode;

// Example: "310"
@property (nonatomic, copy, nullable) NSString *mobileCountryCode;

// Example: "410"
@property (nonatomic, copy, nullable) NSString *mobileNetworkCode;

@end

NS_ASSUME_NONNULL_END
