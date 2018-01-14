//
//  BranchLinkProperties+RNBranch.m
//  ABI25_0_0RNBranch
//
//  Created by Jimmy Dee on 1/26/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "ABI25_0_0BranchLinkProperties+RNBranch.h"
#import "ABI25_0_0NSObject+RNBranch.h"
#import "ABI25_0_0RNBranchProperty.h"

@implementation BranchLinkProperties(ABI25_0_0RNBranch)

+ (NSDictionary<NSString *,ABI25_0_0RNBranchProperty *> *)supportedProperties
{
    static NSDictionary<NSString *, ABI25_0_0RNBranchProperty *> *_linkProperties;
    static dispatch_once_t once = 0;
    dispatch_once(&once, ^{
        _linkProperties =
        @{
          @"alias": [ABI25_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAlias:) type:NSString.class],
          @"campaign": [ABI25_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCampaign:) type:NSString.class],
          @"channel": [ABI25_0_0RNBranchProperty propertyWithSetterSelector:@selector(setChannel:) type:NSString.class],
          // @"duration": [ABI25_0_0RNBranchProperty propertyWithSetterSelector:@selector(setMatchDuration:) type:NSNumber.class], // deprecated
          @"feature": [ABI25_0_0RNBranchProperty propertyWithSetterSelector:@selector(setFeature:) type:NSString.class],
          @"stage": [ABI25_0_0RNBranchProperty propertyWithSetterSelector:@selector(setStage:) type:NSString.class],
          @"tags": [ABI25_0_0RNBranchProperty propertyWithSetterSelector:@selector(setTags:) type:NSArray.class]
          };
    });
    
    return _linkProperties;
}

- (instancetype)initWithMap:(NSDictionary *)map
{
    self = [self init];
    if (self) {
        [self setSupportedPropertiesWithMap:map];
    }
    return self;
}

@end
