//
//  BranchUserCompletedActionRequest.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "Branch.h"
#import "BNCServerRequest.h"

@interface BranchUserCompletedActionRequest : BNCServerRequest
- (id)initWithAction:(NSString *)action state:(NSDictionary *)state;
- (id)initWithAction:(NSString *)action state:(NSDictionary *)state withBranchViewCallback:(id)callback ;
@end
