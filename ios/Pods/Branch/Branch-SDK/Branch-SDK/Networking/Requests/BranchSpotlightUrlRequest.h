//
//  BranchSpotlightUrlRequest.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 7/23/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#import "BranchShortUrlRequest.h"

@interface BranchSpotlightUrlRequest : BranchShortUrlRequest

- (id)initWithParams:(NSDictionary *)params callback:(callbackWithParams)callback;

@end
