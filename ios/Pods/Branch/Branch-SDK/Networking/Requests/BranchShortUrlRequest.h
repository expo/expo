//
//  BranchShortUrlRequest.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/26/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BNCServerRequest.h"
#import "Branch.h"

@interface BranchShortUrlRequest : BNCServerRequest

@property (nonatomic, assign) BOOL isSpotlightRequest;

- (id)initWithTags:(NSArray *)tags alias:(NSString *)alias type:(BranchLinkType)type matchDuration:(NSInteger)duration channel:(NSString *)channel feature:(NSString *)feature stage:(NSString *)stage campaign:(NSString *)campaign params:(NSDictionary *)params linkData:(BNCLinkData *)linkData linkCache:(BNCLinkCache *)linkCache callback:(callbackWithUrl)callback;

@end
