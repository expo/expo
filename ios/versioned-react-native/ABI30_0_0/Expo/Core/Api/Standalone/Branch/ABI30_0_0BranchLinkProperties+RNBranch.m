//
//  BranchLinkProperties+RNBranch.m
//  ABI30_0_0RNBranch
//
//  Created by Jimmy Dee on 1/26/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "ABI30_0_0BranchLinkProperties+RNBranch.h"
#import "ABI30_0_0NSObject+RNBranch.h"
#import "ABI30_0_0RNBranchProperty.h"

@implementation BranchLinkProperties(ABI30_0_0RNBranch)

+ (NSDictionary<NSString *,ABI30_0_0RNBranchProperty *> *)supportedProperties
{
    static NSDictionary<NSString *, ABI30_0_0RNBranchProperty *> *_linkProperties;
    static dispatch_once_t once = 0;
    dispatch_once(&once, ^{
        _linkProperties =
        @{
          @"alias": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setAlias:) type:NSString.class],
          @"campaign": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setCampaign:) type:NSString.class],
          @"channel": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setChannel:) type:NSString.class],
          // @"duration": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setMatchDuration:) type:NSNumber.class], // deprecated
          @"feature": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setFeature:) type:NSString.class],
          @"stage": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setStage:) type:NSString.class],
          @"tags": [ABI30_0_0RNBranchProperty propertyWithSetterSelector:@selector(setTags:) type:NSArray.class]
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
