//
//  BNCServerRequest.h
//  Branch-SDK
//
//  Created by Alex Austin on 6/5/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#import "BNCServerInterface.h"

@interface BNCServerRequest : NSObject <NSSecureCoding>

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback;
- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error;
- (void)safeSetValue:(NSObject *)value forKey:(NSString *)key onDict:(NSMutableDictionary *)dict;
@end
