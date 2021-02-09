//
//  BranchCPIDRequest.m
//  Branch
//
//  Created by Ernest Cho on 9/9/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BranchCPIDRequest.h"
#import "BNCPreferenceHelper.h"
#import "BranchConstants.h"

@implementation BranchCPIDRequest

- (NSString *)serverURL {    
    return [[BNCPreferenceHelper preferenceHelper] getAPIURL:BRANCH_REQUEST_ENDPOINT_CPID];
}

// all required fields for this request is added by BNCServerInterface
- (NSMutableDictionary *)buildRequestParams {
    NSMutableDictionary *params = [NSMutableDictionary new];
    return params;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    NSDictionary *params = [self buildRequestParams];
    [serverInterface postRequest:params url:[self serverURL] key:key callback:callback];
}

// unused, callee handles parsing the json response
- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error { }

@end
