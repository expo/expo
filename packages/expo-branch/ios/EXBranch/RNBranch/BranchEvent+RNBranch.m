//
//  BranchEvent+RNBranch.m
//  Branch-SDK
//
//  Created by Jimmy Dee on 11/28/17.
//

#import "BranchEvent+RNBranch.h"
#import "NSObject+RNBranch.h"
#import "RNBranchProperty.h"

@implementation BranchEvent(RNBranch)

+ (NSDictionary<NSString *,RNBranchProperty *> *)supportedProperties
{
    static NSDictionary<NSString *, RNBranchProperty *> *_eventProperties;
    static dispatch_once_t once = 0;
    dispatch_once(&once, ^{
        _eventProperties =
        @{
          @"transactionID": [RNBranchProperty propertyWithSetterSelector:@selector(setTransactionID:) type:NSString.class],
          @"currency": [RNBranchProperty propertyWithSetterSelector:@selector(setCurrency:) type:NSString.class],
          @"revenue": [RNBranchProperty propertyWithSetterSelector:@selector(setRevenueWithString:) type:NSString.class],
          @"shipping": [RNBranchProperty propertyWithSetterSelector:@selector(setShippingWithString:) type:NSString.class],
          @"tax": [RNBranchProperty propertyWithSetterSelector:@selector(setTaxWithString:) type:NSString.class],
          @"coupon": [RNBranchProperty propertyWithSetterSelector:@selector(setCoupon:) type:NSString.class],
          @"affiliation": [RNBranchProperty propertyWithSetterSelector:@selector(setAffiliation:) type:NSString.class],
          @"description": [RNBranchProperty propertyWithSetterSelector:@selector(setEventDescription:) type:NSString.class],
          @"searchQuery": [RNBranchProperty propertyWithSetterSelector:@selector(setSearchQuery:) type:NSString.class],
          @"customData": [RNBranchProperty propertyWithSetterSelector:@selector(setCustomData:) type:NSDictionary.class]
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
