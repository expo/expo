//
//  BNCTelephony.m
//  Branch
//
//  Created by Ernest Cho on 11/14/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCTelephony.h"
#import <CoreTelephony/CTCarrier.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>

@implementation BNCTelephony

- (instancetype)init {
    self = [super init];
    if (self) {
        [self loadCarrierInformation];
    }
    return self;
}

// This only works if device has cell service, otherwise all values are nil
- (void)loadCarrierInformation {
    CTTelephonyNetworkInfo *networkInfo = [CTTelephonyNetworkInfo new];
    CTCarrier *carrier = [networkInfo subscriberCellularProvider];
    
    self.carrierName = carrier.carrierName;
    self.isoCountryCode = carrier.isoCountryCode;
    self.mobileCountryCode = carrier.mobileCountryCode;
    self.mobileNetworkCode = carrier.mobileNetworkCode;
}

@end
