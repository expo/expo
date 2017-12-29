//
//  BranchUniversalObject+RNBranch.m
//  ABI21_0_0RNBranch
//
//  Created by Jimmy Dee on 1/26/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import <ReactABI21_0_0/ABI21_0_0RCTLog.h>

#import "ABI21_0_0BranchUniversalObject+RNBranch.h"
#import "ABI21_0_0NSObject+RNBranch.h"
#import "ABI21_0_0RNBranchProperty.h"

@implementation BranchUniversalObject(ABI21_0_0RNBranch)

+ (NSDictionary<NSString *,ABI21_0_0RNBranchProperty *> *)supportedProperties
{
    static NSDictionary<NSString *, ABI21_0_0RNBranchProperty *> *_universalObjectProperties;
    static dispatch_once_t once = 0;
    dispatch_once(&once, ^{
        _universalObjectProperties =
        @{
          @"automaticallyListOnSpotlight": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAutomaticallyListOnSpotlightWithNumber:) type:NSNumber.class],
          @"canonicalUrl": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCanonicalUrl:) type:NSString.class],
          @"contentDescription": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setContentDescription:) type:NSString.class],
          @"contentImageUrl": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setImageUrl:) type:NSString.class],
          @"contentIndexingMode": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setContentIndexingMode:) type:NSString.class],
          @"currency": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCurrency:) type:NSString.class],
          @"expirationDate": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setExpirationDateWithString:) type:NSString.class],
          @"keywords": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setKeywords:) type:NSArray.class],
          @"metadata": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setMetadata:) type:NSDictionary.class],
          @"price": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setPriceWithNumber:) type:NSNumber.class],
          @"title": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setTitle:) type:NSString.class],
          @"type": [ABI21_0_0RNBranchProperty propertyWithSetterSelector:@selector(setType:) type:NSString.class]
          };
    });
    
    return _universalObjectProperties;
}

- (instancetype)initWithMap:(NSDictionary *)map
{
    NSString *canonicalIdentifier = map[@"canonicalIdentifier"];
    NSMutableDictionary *mutableMap = map.mutableCopy;
    [mutableMap removeObjectForKey:@"canonicalIdentifier"];

    self = [self initWithCanonicalIdentifier:canonicalIdentifier];
    if (self) {
        [self setSupportedPropertiesWithMap:mutableMap];
    }
    return self;
}

- (void)setContentIndexingMode:(NSString *)contentIndexingMode
{
    if ([contentIndexingMode isEqualToString:@"private"]) {
        self.contentIndexMode = ContentIndexModePrivate;
    }
    else if ([contentIndexingMode isEqualToString:@"public"]) {
        self.contentIndexMode = ContentIndexModePublic;
    }
    else {
        ABI21_0_0RCTLogWarn(@"Invalid value \"%@\" for \"contentIndexingMode\". Supported values are \"public\" and \"private\".", contentIndexingMode);
    }
}

- (void)setPriceWithNumber:(NSNumber *)price
{
    self.price = price.floatValue;
}

- (void)setAutomaticallyListOnSpotlightWithNumber:(NSNumber *)flag
{
    self.automaticallyListOnSpotlight = flag.boolValue;
}

- (void)setExpirationDateWithString:(NSString *)expirationDate
{
    struct tm expiration;
    if (!strptime(expirationDate.UTF8String, "%Y-%m-%dT%H:%M:%S", &expiration)) {
        ABI21_0_0RCTLogWarn(@"Invalid expiration date format. Valid format is YYYY-mm-ddTHH:MM:SS, e.g. 2017-02-01T00:00:00. All times UTC.");
        return;
    }

    self.expirationDate = [NSDate dateWithTimeIntervalSince1970:timegm(&expiration)];
}

@end
