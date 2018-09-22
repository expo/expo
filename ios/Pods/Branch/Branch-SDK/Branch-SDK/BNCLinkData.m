//
//  BNCLinkData.m
//  Branch-SDK
//
//  Created by Qinwei Gong on 1/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//


#import "BNCLinkData.h"
#import "BNCEncodingUtils.h"
#import "BranchConstants.h"


@interface BNCLinkData ()
@property (strong, nonatomic) NSArray *tags;
@property (strong, nonatomic) NSString *alias;
@property (strong, nonatomic) NSString *channel;
@property (strong, nonatomic) NSString *feature;
@property (strong, nonatomic) NSString *stage;
@property (strong, nonatomic) NSString *campaign;
@property (strong, nonatomic) NSDictionary *params;
@property (strong, nonatomic) NSString *ignoreUAString;
@property (assign, nonatomic) BranchLinkType type;
@property (assign, nonatomic) NSUInteger duration;
@end


@implementation BNCLinkData

- (id)init {
    if ((self = [super init])) {
        self.data = [[NSMutableDictionary alloc] init];
        self.data[@"source"] = @"ios";
    }
    return self;
}

- (void)setupTags:(NSArray *)tags {
    if (tags) {
        _tags = tags;

        self.data[BRANCH_REQUEST_KEY_URL_TAGS] = tags;
    }
}

- (void)setupAlias:(NSString *)alias {
    if (alias) {
        _alias = alias;

        self.data[BRANCH_REQUEST_KEY_URL_ALIAS] = alias;
    }
}

- (void)setupType:(BranchLinkType)type {
    if (type) {
        _type = type;

        self.data[BRANCH_REQUEST_KEY_URL_LINK_TYPE] = @(type);
    }
}

- (void)setupMatchDuration:(NSUInteger)duration {
    if (duration > 0) {
        _duration = duration;

        self.data[BRANCH_REQUEST_KEY_URL_DURATION] = @(duration);
    }
}

- (void)setupChannel:(NSString *)channel {
    if (channel) {
        _channel = channel;

        self.data[BRANCH_REQUEST_KEY_URL_CHANNEL] = channel;
    }
}

- (void)setupFeature:(NSString *)feature {
    if (feature) {
        _feature = feature;

        self.data[BRANCH_REQUEST_KEY_URL_FEATURE] = feature;
    }
}

- (void)setupStage:(NSString *)stage {
    if (stage) {
        _stage = stage;

        self.data[BRANCH_REQUEST_KEY_URL_STAGE] = stage;
    }
}

- (void)setupCampaign:(NSString *)campaign {
    if (campaign) {
        _campaign = campaign;
        
        self.data[BRANCH_REQUEST_KEY_URL_CAMPAIGN] = campaign;
    }
}

- (void)setupIgnoreUAString:(NSString *)ignoreUAString {
    if (ignoreUAString) {
        _ignoreUAString = ignoreUAString;
        
        self.data[BRANCH_REQUEST_KEY_URL_IGNORE_UA_STRING] = ignoreUAString;
    }
}

- (void)setupParams:(NSDictionary *)params {
    if (params) {
        _params = params;

        self.data[BRANCH_REQUEST_KEY_URL_DATA] = params;
    }
}

- (NSUInteger)hash {
    NSUInteger result = 1;
    NSUInteger prime = 19;

    NSString *encodedParams = [BNCEncodingUtils encodeDictionaryToJsonString:self.params];
    result = prime * result + self.type;
    result = prime * result + [[BNCEncodingUtils md5Encode:self.alias] hash];
    result = prime * result + [[BNCEncodingUtils md5Encode:self.channel] hash];
    result = prime * result + [[BNCEncodingUtils md5Encode:self.feature] hash];
    result = prime * result + [[BNCEncodingUtils md5Encode:self.stage] hash];
    result = prime * result + [[BNCEncodingUtils md5Encode:self.campaign] hash];
    result = prime * result + [[BNCEncodingUtils md5Encode:encodedParams] hash];
    result = prime * result + self.duration;
    
    for (NSString *tag in self.tags) {
        result = prime * result + [[BNCEncodingUtils md5Encode:tag] hash];
    }
    
    return result;
}

- (void)encodeWithCoder:(NSCoder *)coder {
    if (self.tags) {
        [coder encodeObject:self.tags forKey:BRANCH_REQUEST_KEY_URL_TAGS];
    }
    if (self.alias) {
        [coder encodeObject:self.alias forKey:BRANCH_REQUEST_KEY_URL_ALIAS];
    }
    if (self.type) {
        [coder encodeObject:@(self.type) forKey:BRANCH_REQUEST_KEY_URL_LINK_TYPE];
    }
    if (self.channel) {
        [coder encodeObject:self.channel forKey:BRANCH_REQUEST_KEY_URL_CHANNEL];
    }
    if (self.feature) {
        [coder encodeObject:self.feature forKey:BRANCH_REQUEST_KEY_URL_FEATURE];
    }
    if (self.stage) {
        [coder encodeObject:self.stage forKey:BRANCH_REQUEST_KEY_URL_STAGE];
    }
    if (self.campaign) {
        [coder encodeObject:self.campaign forKey:BRANCH_REQUEST_KEY_URL_CAMPAIGN];
    }
    if (self.params) {
        NSString *encodedParams = [BNCEncodingUtils encodeDictionaryToJsonString:self.params];
        [coder encodeObject:encodedParams forKey:BRANCH_REQUEST_KEY_URL_DATA];
    }
    if (self.duration > 0) {
        [coder encodeObject:@(self.duration) forKey:BRANCH_REQUEST_KEY_URL_DURATION];
    }
}

- (id)initWithCoder:(NSCoder *)coder {
    if ((self = [super init])) {
        self.tags = [coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_TAGS];
        self.alias = [coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_ALIAS];
        self.type = [[coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_LINK_TYPE] integerValue];
        self.channel = [coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_CHANNEL];
        self.feature = [coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_FEATURE];
        self.stage = [coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_STAGE];
        self.campaign = [coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_CAMPAIGN];
        self.duration = [[coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_DURATION] integerValue];
        
        NSString *encodedParams = [coder decodeObjectForKey:BRANCH_REQUEST_KEY_URL_DATA];
        self.params = [BNCEncodingUtils decodeJsonStringToDictionary:encodedParams];
    }

    return self;
}

@end
