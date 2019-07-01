//
//  BranchRegisterViewRequest.m
//  Branch-TestBed
//
//  Created by Derrick Staten on 10/16/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#import "BranchRegisterViewRequest.h"
#import "BNCPreferenceHelper.h"
#import "BranchConstants.h"
#import "BNCSystemObserver.h"

@interface BranchRegisterViewRequest ()

@property (strong, nonatomic) NSDictionary *params;
@property (strong, nonatomic) callbackWithParams callback;

@end

@implementation BranchRegisterViewRequest

- (id)initWithParams:(NSDictionary *)params andCallback:(callbackWithParams)callback {
    if ((self = [super init])) {
        _params = params;
        if (!_params) {
            _params = [[NSDictionary alloc] init];
        }
        _callback = callback;
    }
    
    return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    NSMutableDictionary *data = [NSMutableDictionary dictionary];
    if (self.params) {
        data[BRANCH_REQUEST_KEY_URL_DATA] = [self.params copy];
    }
    
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    [self safeSetValue:preferenceHelper.deviceFingerprintID forKey:BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID onDict:data];
    [self safeSetValue:preferenceHelper.identityID forKey:BRANCH_REQUEST_KEY_BRANCH_IDENTITY onDict:data];
    [self safeSetValue:preferenceHelper.sessionID forKey:BRANCH_REQUEST_KEY_SESSION_ID onDict:data];
    [self safeSetValue:@(preferenceHelper.isDebug) forKey:BRANCH_REQUEST_KEY_DEBUG onDict:data];
    [self safeSetValue:@([BNCSystemObserver isSimulator]) forKey:BRANCH_REQUEST_KEY_IS_SIMULATOR onDict:data];

    [self safeSetValue:[BNCSystemObserver getAppVersion] forKey:BRANCH_REQUEST_KEY_APP_VERSION onDict:data];
    
    [serverInterface postRequest:data url:[preferenceHelper getAPIURL:BRANCH_REQUEST_ENDPOINT_REGISTER_VIEW] key:key callback:callback];
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    if (error) {
        if (self.callback) {
            self.callback([[NSDictionary alloc] init], error);
        }
        return;
    }
    
    if (self.callback) {
        self.callback(response.data, error);
    }
}

#pragma mark - NSCoding methods

- (id)initWithCoder:(NSCoder *)decoder {
    if ((self = [super initWithCoder:decoder])) {
        _params = [decoder decodeObjectOfClass:NSDictionary.class forKey:@"params"];
    }
    return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {
    [super encodeWithCoder:coder];
    [coder encodeObject:self.params forKey:@"params"];
}

@end
