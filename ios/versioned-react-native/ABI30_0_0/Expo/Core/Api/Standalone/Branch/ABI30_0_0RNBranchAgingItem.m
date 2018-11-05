//
//  ABI30_0_0RNBranchAgingItem.m
//  ABI30_0_0RNBranch
//
//  Created by Jimmy Dee on 3/8/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "ABI30_0_0RNBranchAgingItem.h"

@implementation ABI30_0_0RNBranchAgingItem {
    id _item;
}

- (instancetype)initWithItem:(id)item
{
    self = [super init];
    if (self) {
        _item = item;
        _accessTime = [NSDate date].timeIntervalSince1970;
    }
    return self;
}

- (instancetype)init
{
    @throw nil;
}

- (id)item
{
    _accessTime = [NSDate date].timeIntervalSince1970;
    return _item;
}

@end
