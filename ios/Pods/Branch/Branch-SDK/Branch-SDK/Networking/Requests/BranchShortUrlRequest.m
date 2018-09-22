//
//  BranchShortUrlRequest.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/26/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BranchShortUrlRequest.h"
#import "BNCPreferenceHelper.h"
#import "BNCEncodingUtils.h"
#import "BranchConstants.h"

@interface BranchShortUrlRequest ()

@property (strong, nonatomic) NSArray *tags;
@property (strong, nonatomic) NSString *alias;
@property (assign, nonatomic) BranchLinkType type;
@property (assign, nonatomic) NSInteger matchDuration;
@property (strong, nonatomic) NSString *channel;
@property (strong, nonatomic) NSString *feature;
@property (strong, nonatomic) NSString *stage;
@property (strong, nonatomic) NSString *campaign;
@property (strong, nonatomic) NSDictionary *params;
@property (strong, nonatomic) BNCLinkCache *linkCache;
@property (strong, nonatomic) BNCLinkData *linkData;
@property (strong, nonatomic) callbackWithUrl callback;

@end

@implementation BranchShortUrlRequest

- (id)initWithTags:(NSArray *)tags alias:(NSString *)alias type:(BranchLinkType)type matchDuration:(NSInteger)duration channel:(NSString *)channel feature:(NSString *)feature stage:(NSString *)stage campaign:campaign params:(NSDictionary *)params linkData:(BNCLinkData *)linkData linkCache:(BNCLinkCache *)linkCache callback:(callbackWithUrl)callback {
    if ((self = [super init])) {
        _tags = tags;
        _alias = alias;
        _type = type;
        _matchDuration = duration;
        _channel = channel;
        _feature = feature;
        _stage = stage;
        _campaign = campaign;
        _params = params;
        _callback = callback;
        _linkCache = linkCache;
        _linkData = linkData;
        _isSpotlightRequest = NO;
    }
    
    return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface
                key:(NSString *)key
           callback:(BNCServerCallback)callback {
    NSMutableDictionary *params = [[NSMutableDictionary alloc] initWithDictionary:self.linkData.data];

    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    if (!preferenceHelper.trackingDisabled) {
        params[BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID] = preferenceHelper.deviceFingerprintID;
        if (!_isSpotlightRequest)
            params[BRANCH_REQUEST_KEY_BRANCH_IDENTITY] = preferenceHelper.identityID;
        params[BRANCH_REQUEST_KEY_SESSION_ID] = preferenceHelper.sessionID;
    }

    [serverInterface postRequest:params
        url:[preferenceHelper getAPIURL:BRANCH_REQUEST_ENDPOINT_GET_SHORT_URL]
        key:key
        callback:callback];
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    if (error) {
        if (self.callback) {
            BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
            NSString *baseUrl = preferenceHelper.userUrl;
            if (baseUrl.length)
                baseUrl = [preferenceHelper sanitizedMutableBaseURL:baseUrl];
            else
            if (Branch.branchKeyIsSet) {
                baseUrl = [[NSMutableString alloc] initWithFormat:@"%@/a/%@?",
                    BNC_LINK_URL,
                    Branch.branchKey];
            }
            if (baseUrl)
                baseUrl = [self createLongUrlForUserUrl:baseUrl];
            self.callback(baseUrl, error);
        }
        return;
    }
    
    NSString *url = response.data[BRANCH_RESPONSE_KEY_URL];
    
    // cache the link
    if (url) {
        [self.linkCache setObject:url forKey:self.linkData];
    }
    if (self.callback) {
        self.callback(url, nil);
    }
}

- (NSString *)createLongUrlForUserUrl:(NSString *)userUrl {
    NSMutableString *longUrl = [[BNCPreferenceHelper preferenceHelper] sanitizedMutableBaseURL:userUrl];
    for (NSString *tag in self.tags) {
        [longUrl appendFormat:@"tags=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:tag]];
    }
    
    if ([self.alias length]) {
        [longUrl appendFormat:@"alias=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:self.alias]];
    }
    
    if ([self.channel length]) {
        [longUrl appendFormat:@"channel=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:self.channel]];
    }
    
    if ([self.feature length]) {
        [longUrl appendFormat:@"feature=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:self.feature]];
    }
    
    if ([self.stage length]) {
        [longUrl appendFormat:@"stage=%@&", [BNCEncodingUtils stringByPercentEncodingStringForQuery:self.stage]];
    }
    if (self.type) {
        [longUrl appendFormat:@"type=%ld&", (long)self.type];
    }
    if (self.matchDuration) {
        [longUrl appendFormat:@"duration=%ld&", (long)self.matchDuration];
    }

    NSData *jsonData = [BNCEncodingUtils encodeDictionaryToJsonData:self.params];
    NSString *base64EncodedParams = [BNCEncodingUtils base64EncodeData:jsonData];
    [longUrl appendFormat:@"source=ios&data=%@", base64EncodedParams];
    
    return longUrl;
}

#pragma mark - NSCoding methods

- (id)initWithCoder:(NSCoder *)decoder {
    if ((self = [super initWithCoder:decoder])) {
        _tags = [decoder decodeObjectForKey:@"tags"];
        _alias = [decoder decodeObjectForKey:@"alias"];
        _type = [decoder decodeIntegerForKey:@"type"];
        _matchDuration = [decoder decodeIntegerForKey:@"duration"];
        _channel = [decoder decodeObjectForKey:@"channel"];
        _feature = [decoder decodeObjectForKey:@"feature"];
        _stage = [decoder decodeObjectForKey:@"stage"];
        _campaign = [decoder decodeObjectForKey:@"campaign"];
        _params = [BNCEncodingUtils decodeJsonStringToDictionary:[decoder decodeObjectForKey:@"params"]];
        
        // Set up link data
        self.linkData = [[BNCLinkData alloc] init];
        [self.linkData setupType:_type];
        [self.linkData setupTags:_tags];
        [self.linkData setupChannel:_channel];
        [self.linkData setupFeature:_feature];
        [self.linkData setupStage:_stage];
        [self.linkData setupCampaign:_campaign];
        [self.linkData setupAlias:_alias];
        [self.linkData setupMatchDuration:_matchDuration];
        [self.linkData setupParams:_params];
    }
    return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {
    [super encodeWithCoder:coder];
    [coder encodeObject:self.tags forKey:@"tags"];
    [coder encodeObject:self.alias forKey:@"alias"];
    [coder encodeInteger:self.type forKey:@"type"];
    [coder encodeInteger:self.matchDuration forKey:@"duration"];
    [coder encodeObject:self.channel forKey:@"channel"];
    [coder encodeObject:self.feature forKey:@"feature"];
    [coder encodeObject:self.stage forKey:@"stage"];
    [coder encodeObject:self.campaign forKey:@"campaign"];
    [coder encodeObject:[BNCEncodingUtils encodeDictionaryToJsonString:self.params] forKey:@"params"];
}

@end
