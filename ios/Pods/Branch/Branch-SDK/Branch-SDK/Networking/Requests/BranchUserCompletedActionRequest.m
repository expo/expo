//
//  BranchLoadActionsRequest.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BranchUserCompletedActionRequest.h"
#import "BNCPreferenceHelper.h"
#import "BranchConstants.h"
#import "BranchViewHandler.h"
#import "BNCEncodingUtils.h"
#import "BNCLog.h"

@interface BranchUserCompletedActionRequest ()

@property (strong, nonatomic) NSString *action;
@property (strong, nonatomic) NSDictionary *state;
@property (strong, nonatomic) id <BranchViewControllerDelegate> branchViewcallback;

@end

@implementation BranchUserCompletedActionRequest

- (id)initWithAction:(NSString *)action state:(NSDictionary *)state {
    return [self initWithAction:action state:state withBranchViewCallback:nil];
}

- (id)initWithAction:(NSString *)action state:(NSDictionary *)state withBranchViewCallback:(id)callback {
    if ((self = [super init])) {
        _action = action;
        _state = state;
        _branchViewcallback = callback;
    }
    
    return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface
                key:(NSString *)key
           callback:(BNCServerCallback)callback {

    //  Emit a warning if the action is collides with the Branch commerce 'purchase' event.
    if (self.action && [self.action isEqualToString:@"purchase"]) {
        BNCLogWarning(@"You are sending a purchase event with our non-dedicated purchase "
               "method. Please use the sendCommerceEvent:metadata:withCompletion: method.");
    }

    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    params[BRANCH_REQUEST_KEY_ACTION] = self.action;
    params[BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID] = preferenceHelper.deviceFingerprintID;
    params[BRANCH_REQUEST_KEY_BRANCH_IDENTITY] = preferenceHelper.identityID;
    params[BRANCH_REQUEST_KEY_SESSION_ID] = preferenceHelper.sessionID;
    if (preferenceHelper.limitFacebookTracking)
        params[@"limit_facebook_tracking"] = CFBridgingRelease(kCFBooleanTrue);

    if (self.state) {
        params[BRANCH_REQUEST_KEY_STATE] = self.state;
    }
    
    [serverInterface postRequest:params url:[preferenceHelper getAPIURL:BRANCH_REQUEST_ENDPOINT_USER_COMPLETED_ACTION] key:key callback:callback];
    
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    // Check if there is any Branch View to show
    if (!error) {
        NSDictionary *data = response.data;
        NSObject *branchViewDict = data[BRANCH_RESPONSE_KEY_BRANCH_VIEW_DATA];
        if ([branchViewDict isKindOfClass:[NSDictionary class]]) {
           [[BranchViewHandler getInstance] showBranchView:_action withBranchViewDictionary:(NSDictionary *)branchViewDict andWithDelegate:_branchViewcallback];
        }
    }
}

#pragma mark - NSCoding methods

- (id)initWithCoder:(NSCoder *)decoder {
    if ((self = [super initWithCoder:decoder])) {
        _action = [decoder decodeObjectForKey:@"action"];
        _state = [decoder decodeObjectForKey:@"state"];
    }
    
    return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {
    [super encodeWithCoder:coder];
    
    [coder encodeObject:self.action forKey:@"action"];
    [coder encodeObject:self.state forKey:@"state"];
}

@end
