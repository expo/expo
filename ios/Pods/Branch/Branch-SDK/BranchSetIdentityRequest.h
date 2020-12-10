//
//  BranchSetIdentityRequest.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "Branch.h"
#import "BNCServerRequest.h"

@interface BranchSetIdentityRequest : BNCServerRequest

- (id)initWithUserId:(NSString *)userId callback:(callbackWithParams)callback;

@end
