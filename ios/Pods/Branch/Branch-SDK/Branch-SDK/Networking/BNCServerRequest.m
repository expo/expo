//
//  BNCServerRequest.m
//  Branch-SDK
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BNCServerRequest.h"
#import "BNCLog.h"

@implementation BNCServerRequest

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    BNCLogError(@"BNCServerRequest subclasses must implement makeRequest:key:callback:.");
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    BNCLogError(@"BNCServerRequest subclasses must implement processResponse:error:.");
}

- (id)initWithCoder:(NSCoder *)aDecoder {
    return self = [super init];
}

- (void)encodeWithCoder:(NSCoder *)coder {
    // Nothing going on here
}

- (void)safeSetValue:(NSObject *)value forKey:(NSString *)key onDict:(NSMutableDictionary *)dict {
    if (value) {
        dict[key] = value;
    }
}

+ (BOOL) supportsSecureCoding {
    return YES;
}

@end
