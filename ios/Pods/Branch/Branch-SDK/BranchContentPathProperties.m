//
//  ContentPathProperties.m
//  Branch-TestBed
//
//  Created by Sojan P.R. on 8/19/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#import "BranchContentPathProperties.h"
#import "BranchConstants.h"

@implementation BranchContentPathProperties

- (instancetype)init:(NSDictionary *)pathInfo {
    self = [super init];
    if (self) {
        _pathInfo = pathInfo;
        if ([pathInfo objectForKey:BRANCH_HASH_MODE_KEY]) {
            _isClearText = ![[pathInfo objectForKey:BRANCH_HASH_MODE_KEY] boolValue];
        }
    }
    return self;
}

- (NSArray *)getFilteredElements {
    return [_pathInfo objectForKey:BRANCH_FILTERED_KEYS];
}

- (BOOL)isSkipContentDiscovery {
    NSArray *filteredElements = [self getFilteredElements];
    return (filteredElements && filteredElements.count == 0);
}

- (BOOL)isClearText {
    return _isClearText;
}

@end
