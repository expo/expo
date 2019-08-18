//
//  BranchLogoutRequest.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BNCServerRequest.h"
#import "Branch.h"

@interface BranchLogoutRequest : BNCServerRequest

- (id)initWithCallback:(callbackWithStatus)callback;

@end
