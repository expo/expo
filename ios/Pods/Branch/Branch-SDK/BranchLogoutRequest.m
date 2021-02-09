//
//  BranchLogoutRequest.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//


#import "BranchLogoutRequest.h"
#import "BNCPreferenceHelper.h"
#import "BranchConstants.h"
#import "BNCEncodingUtils.h"

@interface BranchLogoutRequest ()
@property (copy) callbackWithStatus callback;
@end


@implementation BranchLogoutRequest

- (id)initWithCallback:(callbackWithStatus)callback {
    if ((self = [super init])) {
        _callback = callback;
    }
    
    return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    NSMutableDictionary *params = [NSMutableDictionary new];
    params[BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID] = preferenceHelper.deviceFingerprintID;
    params[BRANCH_REQUEST_KEY_SESSION_ID] = preferenceHelper.sessionID;
    params[BRANCH_REQUEST_KEY_BRANCH_IDENTITY] = preferenceHelper.identityID;
    [serverInterface postRequest:params url:[preferenceHelper getAPIURL:BRANCH_REQUEST_ENDPOINT_LOGOUT] key:key callback:callback];
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    if (error) {
        if (self.callback) {
            self.callback(NO, error);
        }
        return;
    }

    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    preferenceHelper.sessionID = response.data[BRANCH_RESPONSE_KEY_SESSION_ID];
    preferenceHelper.identityID = BNCStringFromWireFormat(response.data[BRANCH_RESPONSE_KEY_BRANCH_IDENTITY]);
    preferenceHelper.userUrl = response.data[BRANCH_RESPONSE_KEY_USER_URL];
    preferenceHelper.userIdentity = nil;
    preferenceHelper.installParams = nil;
    preferenceHelper.sessionParams = nil;
    [preferenceHelper clearUserCreditsAndCounts];
    
    if (self.callback) {
        self.callback(YES, nil);
    }
}

@end
