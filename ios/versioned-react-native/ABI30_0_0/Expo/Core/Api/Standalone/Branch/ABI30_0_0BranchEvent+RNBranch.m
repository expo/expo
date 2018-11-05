//
//  BranchEvent+RNBranch.m
//  Branch-SDK
//
//  Created by Jimmy Dee on 11/28/17.
//

#import "ABI30_0_0BranchEvent+RNBranch.h"
#import "ABI30_0_0NSObject+RNBranch.h"
#import "ABI30_0_0RNBranchProperty.h"

@implementation BranchEvent(ABI30_0_0RNBranch)

+ (NSDictionary<NSString *,ABI30_0_0RNBranchProperty *> *)supportedProperties
{
    static NSDictionary<NSString *, ABI30_0_0RNBranchProperty *> *_eventProperties;
    static dispatch_once_t once = 0;
    dispatch_once(&once, ^{
        _eventProperties =
        @{
          @"transactionID": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setTransactionID:) type:NSString.class],
          @"currency": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCurrency:) type:NSString.class],
          @"revenue": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setRevenueWithString:) type:NSString.class],
          @"shipping": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setShippingWithString:) type:NSString.class],
          @"tax": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setTaxWithString:) type:NSString.class],
          @"coupon": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCoupon:) type:NSString.class],
          @"affiliation": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAffiliation:) type:NSString.class],
          @"description": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setEventDescription:) type:NSString.class],
          @"searchQuery": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setSearchQuery:) type:NSString.class],
          @"customData": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCustomData:) type:NSDictionary.class]
          };
    });

    return _eventProperties;
}

- (instancetype)initWithName:(NSString *)eventName map:(NSDictionary *)map
{
    self = [self initWithName:eventName];
    if (self) {
        [self setSupportedPropertiesWithMap:map];
    }
    return self;
}

- (void)setRevenueWithString:(NSString *)revenue
{
    self.revenue = [NSDecimalNumber decimalNumberWithString:revenue];
}

- (void)setShippingWithString:(NSString *)shipping
{
    self.shipping = [NSDecimalNumber decimalNumberWithString:shipping];
}

- (void)setTaxWithString:(NSString *)tax
{
    self.tax = [NSDecimalNumber decimalNumberWithString:tax];
}

@end
