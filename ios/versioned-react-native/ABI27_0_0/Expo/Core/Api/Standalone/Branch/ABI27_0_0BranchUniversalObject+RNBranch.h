//
//  BranchUniversalObject+RNBranch.h
//  ABI27_0_0RNBranch
//
//  Created by Jimmy Dee on 1/26/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import <Branch/Branch.h>

@class ABI27_0_0RNBranchProperty;

@interface BranchUniversalObject(ABI27_0_0RNBranch)

- (instancetype)initWithMap:(NSDictionary *)map;

- (void)setAutomaticallyListOnSpotlightWithNumber:(NSNumber *)automaticallyListOnSpotlight;
- (void)setContentIndexingMode:(NSString *)contentIndexingMode;
- (void)setExpirationDateWithString:(NSString *)expirationDate;
- (void)setPriceWithNumber:(NSNumber *)price;

@end
