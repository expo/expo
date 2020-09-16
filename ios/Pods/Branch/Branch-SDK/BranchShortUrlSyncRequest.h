//
//  BranchShortUrlSyncRequest.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/27/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "Branch.h"

@interface BranchShortUrlSyncRequest : NSObject

- (id)initWithTags:(NSArray *)tags
             alias:(NSString *)alias
              type:(BranchLinkType)type
     matchDuration:(NSInteger)duration
           channel:(NSString *)channel
           feature:(NSString *)feature
             stage:(NSString *)stage
          campaign:(NSString *)campaign
            params:(NSDictionary *)params
          linkData:(BNCLinkData *)linkData
         linkCache:(BNCLinkCache *)linkCache;

- (BNCServerResponse *)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key;

- (NSString *)processResponse:(BNCServerResponse *)response;

+ (NSString *)createLinkFromBranchKey:(NSString *)branchKey
                                 tags:(NSArray *)tags
                                alias:(NSString *)alias
                                 type:(BranchLinkType)type
                        matchDuration:(NSInteger)duration
                              channel:(NSString *)channel
                              feature:(NSString *)feature
                                stage:(NSString *)stage
                               params:(NSDictionary *)params;

@end
