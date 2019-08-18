//
//  BranchRegisterViewRequest.h
//  Branch-TestBed
//
//  Created by Derrick Staten on 10/16/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#import "BNCServerRequest.h"
#import "Branch.h"

@interface BranchRegisterViewRequest : BNCServerRequest

- (id)initWithParams:(NSDictionary *)params andCallback:(callbackWithParams)callback;

@end
