//
//  BranchLoadRewardsRequest.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BranchLoadRewardsRequest.h"
#import "BNCPreferenceHelper.h"
#import "BranchConstants.h"

@interface BranchLoadRewardsRequest ()

@property (copy) callbackWithStatus callback;

@end

@implementation BranchLoadRewardsRequest

- (id)initWithCallback:(callbackWithStatus)callback {
    if ((self = [super init])) {
        _callback = callback;
    }

    return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    NSString *endpoint = [BRANCH_REQUEST_ENDPOINT_LOAD_REWARDS stringByAppendingPathComponent:preferenceHelper.identityID];
    [serverInterface getRequest:nil url:[preferenceHelper getAPIURL:endpoint] key:key callback:callback];
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    if (error) {
        if (self.callback) {
            self.callback(NO, error);
        }
        return;
    }

    BOOL hasUpdated = NO;
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    [preferenceHelper synchronize];
    NSDictionary *currentCreditDictionary = [preferenceHelper getCreditDictionary];
    NSArray *responseKeys = [response.data allKeys];
    NSArray *storedKeys = [currentCreditDictionary allKeys];

    if ([responseKeys count] && ([response.data isKindOfClass:[NSDictionary class]] || [response.data isKindOfClass:[NSMutableDictionary class]])) {
        
        for (NSString *key in response.data) {
            if (![key isKindOfClass:[NSString class]]) { continue; }
            
            NSInteger credits = [preferenceHelper getCreditCountForBucket:key];
            if (response.data[key] && [response.data[key] respondsToSelector:@selector(integerValue)]) {
                credits = [response.data[key] integerValue];
            }

            BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
            if (credits != [preferenceHelper getCreditCountForBucket:key]) {
                hasUpdated = YES;
            }

            [preferenceHelper setCreditCount:credits forBucket:key];
        }
        for(NSString *key in storedKeys) {
            if (![key isKindOfClass:[NSString class]]) { continue; }

            if(![response.data objectForKey:key]) {
                [preferenceHelper removeCreditCountForBucket:key];
                hasUpdated = YES;
            }
        }
    } else {
        if ([storedKeys count]) {
            [preferenceHelper clearUserCredits];
            hasUpdated = YES;
        }
    }

    [preferenceHelper synchronize];
    if (self.callback) {
        self.callback(hasUpdated, nil);
    }
}

@end
