//
//  BranchUniversalObject+RNBranch.h
//  RNBranch
//
//  Created by Jimmy Dee on 1/26/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import <Branch/Branch.h>

@class RNBranchProperty;

@interface BranchUniversalObject(RNBranch)

- (instancetype)initWithMap:(NSDictionary *)map;

- (void)setAutomaticallyListOnSpotlightWithNumber:(NSNumber *)automaticallyListOnSpotlight;
- (void)setContentIndexingMode:(NSString *)contentIndexingMode;
- (void)setExpirationDateWithString:(NSString *)expirationDate;
- (void)setPriceWithNumber:(NSNumber *)price;

@end
