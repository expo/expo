//
//  BranchCreditHistoryRequest.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/22/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BNCServerRequest.h"
#import "Branch.h"

@interface BranchCreditHistoryRequest : BNCServerRequest

- (id)initWithBucket:(NSString *)bucket creditTransactionId:(NSString *)creditTransactionId length:(NSInteger)length order:(BranchCreditHistoryOrder)order callback:(callbackWithList)callback;

@end
