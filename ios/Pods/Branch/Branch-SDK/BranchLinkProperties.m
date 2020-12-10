//
//  BranchLinkProperties.m
//  Branch-TestBed
//
//  Created by Derrick Staten on 10/16/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#import "BranchLinkProperties.h"
#import "BranchConstants.h"

@implementation BranchLinkProperties

- (NSDictionary *)controlParams {
    if (!_controlParams) {
        _controlParams = [[NSDictionary alloc] init];
    }
    return _controlParams;
}

- (void)addControlParam:(NSString *)controlParam withValue:(NSString *)value {
    if (!controlParam) return;
    NSMutableDictionary *temp = [self.controlParams mutableCopy];
    temp[controlParam] = value;
    _controlParams = [temp copy];
}

+ (BranchLinkProperties *)getBranchLinkPropertiesFromDictionary:(NSDictionary *)dictionary {
    BranchLinkProperties *linkProperties = [[BranchLinkProperties alloc] init];
    
    if (dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_TAGS]]) {
        linkProperties.tags = dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_TAGS]];
    }
    if (dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_FEATURE]]) {
        linkProperties.feature = dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_FEATURE]];
    }
    if (dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_ALIAS]]) {
        linkProperties.alias = dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_ALIAS]];
    }
    if (dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_CHANNEL]]) {
        linkProperties.channel = dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_CHANNEL]];
    }
    if (dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_STAGE]]) {
        linkProperties.stage = dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_STAGE]];
    }
    if (dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_CAMPAIGN]]) {
        linkProperties.campaign = dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_CAMPAIGN]];
    }
    if (dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_DURATION]]) {
        linkProperties.matchDuration = [dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_DURATION]] intValue];
    }
    if (dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_STAGE]]) {
        linkProperties.stage = dictionary[[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_STAGE]];
    }
    
    NSMutableDictionary *controlParams = [[NSMutableDictionary alloc] init];
    for (NSString *oneKey in dictionary.allKeys) {
        if ([oneKey hasPrefix:@"$"]) {
            controlParams[oneKey] = dictionary[oneKey];
        }
    }
    linkProperties.controlParams = controlParams;
    
    return linkProperties;
}

- (NSString *)description {
    return [NSString stringWithFormat:@"BranchLinkProperties | tags: %@ \n feature: %@ \n alias: %@ \n channel: %@ \n stage: %@ \n campaign: %@ \n matchDuration: %lu \n controlParams: %@", self.tags, self.feature, self.alias, self.channel, self.stage, self.campaign, (long)self.matchDuration, self.controlParams];
}

@end
