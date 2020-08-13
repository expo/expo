//
//  BranchCrossPlatformID.m
//  Branch
//
//  Created by Ernest Cho on 9/12/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BranchCrossPlatformID.h"
#import "BranchCPIDRequest.h"
#import "BNCLog.h"
#import "BNCJSONUtility.h"

@implementation BranchProbabilisticCrossPlatformID

+ (BranchProbabilisticCrossPlatformID *)buildFromJSON:(NSDictionary *)json {
    BranchProbabilisticCrossPlatformID *pcpid = [BranchProbabilisticCrossPlatformID new];
    pcpid->_crossPlatformID = [BNCJSONUtility stringForKey:@"id" json:json];
    pcpid->_score = [BNCJSONUtility numberForKey:@"probability" json:json];
    
    // only return obj if we found all the data we expected
    if (pcpid.crossPlatformID && pcpid.score) {
        return pcpid;
    }
    return nil;
}

@end

@implementation BranchCrossPlatformID

+ (BranchCrossPlatformID *)buildFromJSON:(NSDictionary *)json {
    NSDictionary *userData = [BNCJSONUtility dictionaryForKey:@"user_data" json:json];
    if (!userData) {
        return nil;
    }
        
    BranchCrossPlatformID *cpid = [BranchCrossPlatformID new];
    cpid->_crossPlatformID = [BNCJSONUtility stringForKey:@"cross_platform_id" json:userData];
    cpid->_developerID = [BNCJSONUtility stringForKey:@"developer_identity" json:userData];
    cpid->_pastCrossPlatformIDs = [BNCJSONUtility stringArrayForKey:@"past_cross_platform_ids" json:userData];
    
    // parse probability pairs
    NSArray *tmp = [BNCJSONUtility arrayForKey:@"prob_cross_platform_ids" json:userData];
    if (tmp) {
        NSMutableArray<BranchProbabilisticCrossPlatformID *> *pcpidArray = [NSMutableArray<BranchProbabilisticCrossPlatformID *> new];
        for (id dict in tmp) {
            BranchProbabilisticCrossPlatformID *pcpid = [BranchProbabilisticCrossPlatformID buildFromJSON:dict];
            if (pcpid) {
                [pcpidArray addObject:pcpid];
            }
        }
        cpid->_probabiliticCrossPlatformIDs = pcpidArray;
    }
        
    // only return obj if we found all the data we expected.  lists can be empty
    if (cpid.crossPlatformID && cpid.pastCrossPlatformIDs && cpid.probabiliticCrossPlatformIDs) {
        return cpid;
    }
    return nil;
}

+ (void)requestCrossPlatformIdData:(BNCServerInterface *)serverInterface key:(NSString *)key completion:(void(^) (BranchCrossPlatformID * _Nullable cpid))completion {
    BranchCPIDRequest *request = [BranchCPIDRequest new];
    [request makeRequest:serverInterface key:key callback:^(BNCServerResponse *response, NSError *error) {

        // error is logged by the network service, skip parsing on error
        if (error) {
            if (completion) {
                completion(nil);
            }
            return;
        }
        
        BranchCrossPlatformID *cpid = [BranchCrossPlatformID buildFromJSON:response.data];
        if (completion) {
            completion(cpid);
        }
    }];
}

@end
