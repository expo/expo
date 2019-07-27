//
//  BranchCreditHistoryRequest.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BranchCreditHistoryRequest.h"
#import "BNCPreferenceHelper.h"
#import "BranchConstants.h"

@interface BranchCreditHistoryRequest ()

@property (strong, nonatomic) callbackWithList callback;
@property (strong, nonatomic) NSString *bucket;
@property (strong, nonatomic) NSString *creditTransactionId;
@property (assign, nonatomic) NSInteger length;
@property (assign, nonatomic) BranchCreditHistoryOrder order;

@end

@implementation BranchCreditHistoryRequest

- (id)initWithBucket:(NSString *)bucket creditTransactionId:(NSString *)creditTransactionId length:(NSInteger)length order:(BranchCreditHistoryOrder)order callback:(callbackWithList)callback {
    if ((self = [super init])) {
        _bucket = bucket;
        _creditTransactionId = creditTransactionId;
        _length = length;
        _order = order;
        _callback = callback;
    }

    return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];
    
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    params[BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID] = preferenceHelper.deviceFingerprintID;
    params[BRANCH_REQUEST_KEY_BRANCH_IDENTITY] = preferenceHelper.identityID;
    params[BRANCH_REQUEST_KEY_SESSION_ID] = preferenceHelper.sessionID;
    params[BRANCH_REQUEST_KEY_LENGTH] = @(self.length);
    params[BRANCH_REQUEST_KEY_DIRECTION] = self.order == BranchMostRecentFirst ? @"desc" : @"asc";

    if (self.bucket) {
        params[BRANCH_REQUEST_KEY_BUCKET] = self.bucket;
    }
    
    if (self.creditTransactionId) {
        params[BRANCH_REQUEST_KEY_STARTING_TRANSACTION_ID] = self.creditTransactionId;
    }
    
    [serverInterface postRequest:params url:[preferenceHelper getAPIURL:BRANCH_REQUEST_ENDPOINT_CREDIT_HISTORY] key:key callback:callback];
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    if (error) {
        if (self.callback) {
            self.callback(nil, error);
        }
        return;
    }
    
    for (NSMutableDictionary *transaction in response.data) {
        if ([transaction[BRANCH_RESPONSE_KEY_REFERRER] isEqual:[NSNull null]]) {
            [transaction removeObjectForKey:BRANCH_RESPONSE_KEY_REFERRER];
        }
        if ([transaction[BRANCH_RESPONSE_KEY_REFERREE] isEqual:[NSNull null]]) {
            [transaction removeObjectForKey:BRANCH_RESPONSE_KEY_REFERREE];
        }
    }
    
    if (self.callback) {
        self.callback(response.data, nil);
    }
}

#pragma mark - NSCoding methods

- (id)initWithCoder:(NSCoder *)decoder {
    if ((self = [super initWithCoder:decoder])) {
        _bucket = [decoder decodeObjectForKey:@"bucket"];
        _creditTransactionId = [decoder decodeObjectForKey:@"creditTransactionId"];
        _length = [decoder decodeIntegerForKey:@"length"];
        _order = [decoder decodeIntegerForKey:@"order"];
    }
    return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {
    [super encodeWithCoder:coder];  
    [coder encodeObject:self.bucket forKey:@"bucket"];
    [coder encodeObject:self.creditTransactionId forKey:@"creditTransactionId"];
    [coder encodeInteger:self.length forKey:@"length"];
    [coder encodeInteger:self.order forKey:@"order"];
}

@end
