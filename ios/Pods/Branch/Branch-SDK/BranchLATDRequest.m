//
//  BranchLATDRequest.m
//  Branch
//
//  Created by Ernest Cho on 9/18/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BranchLATDRequest.h"
#import "BNCPreferenceHelper.h"
#import "BranchConstants.h"

@implementation BranchLATDRequest

- (instancetype)init {
    self = [super init];
    if (self) {
        self.attributionWindow = 30;
    }
    return self;
}

- (NSString *)serverURL {
    return [[BNCPreferenceHelper preferenceHelper] getAPIURL:BRANCH_REQUEST_ENDPOINT_LATD];
}

- (NSMutableDictionary *)buildRequestParams {
    NSMutableDictionary *params = [NSMutableDictionary new];
    [params setObject:@(self.attributionWindow) forKey:@"attribution_window"];
    return params;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    NSDictionary *params = [self buildRequestParams];
    [serverInterface postRequest:params url:[self serverURL] key:key callback:callback];
}

// unused, callee handles parsing the json response
- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error { }

@end
