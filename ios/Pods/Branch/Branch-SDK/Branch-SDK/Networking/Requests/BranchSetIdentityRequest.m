//
//  BranchSetIdentityRequest.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BranchSetIdentityRequest.h"
#import "BNCPreferenceHelper.h"
#import "BNCEncodingUtils.h"
#import "BranchConstants.h"

@interface BranchSetIdentityRequest ()

@property (strong, nonatomic) NSString *userId;
@property (strong, nonatomic) callbackWithParams callback;
@property (assign, nonatomic) BOOL shouldCallCallback;

@end

@implementation BranchSetIdentityRequest

- (id)initWithUserId:(NSString *)userId callback:(callbackWithParams)callback {
    if ((self = [super init])) {
        _userId = userId;
        _callback = callback;
        _shouldCallCallback = YES;
    }
    
    return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    NSMutableDictionary *params = [NSMutableDictionary new];
    params[BRANCH_REQUEST_KEY_DEVELOPER_IDENTITY] = self.userId;
    params[BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID] = preferenceHelper.deviceFingerprintID;
    params[BRANCH_REQUEST_KEY_SESSION_ID] = preferenceHelper.sessionID;
    params[BRANCH_REQUEST_KEY_BRANCH_IDENTITY] = preferenceHelper.identityID;
    [serverInterface postRequest:params url:[preferenceHelper getAPIURL:BRANCH_REQUEST_ENDPOINT_SET_IDENTITY] key:key callback:callback];
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    if (error) {
        if (self.callback && self.shouldCallCallback) {
            self.callback([[NSDictionary alloc] init], error);
        }
        
        self.shouldCallCallback = NO; // don't call the callback next time around
        return;
    }
    
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    preferenceHelper.identityID = BNCStringFromWireFormat(response.data[BRANCH_RESPONSE_KEY_BRANCH_IDENTITY]);
    preferenceHelper.userUrl = response.data[BRANCH_RESPONSE_KEY_USER_URL];
    preferenceHelper.userIdentity = self.userId;
    if (response.data[BRANCH_RESPONSE_KEY_SESSION_ID]) {
        preferenceHelper.sessionID = response.data[BRANCH_RESPONSE_KEY_SESSION_ID];
    }
  
    if (response.data[BRANCH_RESPONSE_KEY_INSTALL_PARAMS]) {
        preferenceHelper.installParams = response.data[BRANCH_RESPONSE_KEY_INSTALL_PARAMS];
    }
    
    if (self.callback && self.shouldCallCallback) {
        NSString *storedParams = preferenceHelper.installParams;
        NSDictionary *installParams = [BNCEncodingUtils decodeJsonStringToDictionary:storedParams];
        self.callback(installParams, nil);
    }
}

#pragma mark - NSCoding methods

// No need to do anything with callback, as the callback itself is gone after the end of a run

- (id)initWithCoder:(NSCoder *)decoder {
    if ((self = [super initWithCoder:decoder])) {
        _userId = [decoder decodeObjectForKey:@"userId"];
    }
    return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {
    [super encodeWithCoder:coder];
    [coder encodeObject:self.userId forKey:@"userId"];
}

@end
