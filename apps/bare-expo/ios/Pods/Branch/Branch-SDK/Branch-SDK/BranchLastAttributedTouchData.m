//
//  BranchLastAttributedTouchData.m
//  Branch
//
//  Created by Ernest Cho on 9/13/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BranchLastAttributedTouchData.h"
#import "BranchLATDRequest.h"
#import "BNCJSONUtility.h"

@implementation BranchLastAttributedTouchData

+ (BranchLastAttributedTouchData *)buildFromJSON:(NSDictionary *)json {
    BranchLastAttributedTouchData *latd = [BranchLastAttributedTouchData new];
    
    latd->_lastAttributedTouchJSON = [BNCJSONUtility dictionaryForKey:@"last_attributed_touch_data" json:json];
    latd->_attributionWindow = [BNCJSONUtility numberForKey:@"attribution_window" json:json];
    
    // only the free form json is required
    if (latd.lastAttributedTouchJSON) {
        return latd;
    }
    return nil;
}

+ (void)requestLastTouchAttributedData:(BNCServerInterface *)serverInterface key:(NSString *)key completion:(void(^) (BranchLastAttributedTouchData *ltad))completion {
    BranchLATDRequest *request = [BranchLATDRequest new];
    [request makeRequest:serverInterface key:key callback:^(BNCServerResponse *response, NSError *error) {
        
        // error is logged by the network service, skip parsing on error
        if (error) {
            if (completion) {
                completion(nil);
            }
            return;
        }
    
        BranchLastAttributedTouchData *latd = [self buildFromJSON:response.data];
        if (completion) {
            completion(latd);
        }
    }];
}

@end
