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
#import "BNCLog.h"

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

+ (void)requestLastTouchAttributedData:(BNCServerInterface *)serverInterface key:(NSString *)key attributionWindow:(NSInteger)window completion:(void(^) (BranchLastAttributedTouchData *latd))completion {
    BranchLATDRequest *request = [BranchLATDRequest new];
    
    // Limit attribution range to about a year.  Although the server only supports up to 90 days as of Nov. 2019, it will fail gracefully for higher values.
    if (window > -1 && window < 365) {
        request.attributionWindow = window;
    } else {
        BNCLogWarning(@"Attribution window is outside the expected range, using 30 days.");
    }
    
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
