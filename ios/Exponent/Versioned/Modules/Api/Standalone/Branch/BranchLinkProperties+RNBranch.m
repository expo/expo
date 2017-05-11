//
//  BranchLinkProperties+RNBranch.m
//  RNBranch
//
//  Created by Jimmy Dee on 1/26/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "BranchLinkProperties+RNBranch.h"
#import "NSObject+RNBranch.h"
#import "RNBranchProperty.h"

@implementation BranchLinkProperties(RNBranch)

+ (NSDictionary<NSString *,RNBranchProperty *> *)supportedProperties
{
    static NSDictionary<NSString *, RNBranchProperty *> *_linkProperties;
    static dispatch_once_t once = 0;
    dispatch_once(&once, ^{
        _linkProperties =
        @{
          @"alias": [RNBranchProperty propertyWithSetterSelector:@selector(setAlias:) type:NSString.class],
          @"campaign": [RNBranchProperty propertyWithSetterSelector:@selector(setCampaign:) type:NSString.class],
          @"channel": [RNBranchProperty propertyWithSetterSelector:@selector(setChannel:) type:NSString.class],
          // @"duration": [RNBranchProperty propertyWithSetterSelector:@selector(setMatchDuration:) type:NSNumber.class], // deprecated
          @"feature": [RNBranchProperty propertyWithSetterSelector:@selector(setFeature:) type:NSString.class],
          @"stage": [RNBranchProperty propertyWithSetterSelector:@selector(setStage:) type:NSString.class],
          @"tags": [RNBranchProperty propertyWithSetterSelector:@selector(setTags:) type:NSArray.class]
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
