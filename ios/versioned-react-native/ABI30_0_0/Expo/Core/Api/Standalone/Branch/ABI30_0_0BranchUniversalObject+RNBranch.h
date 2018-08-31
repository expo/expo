//
//  BranchUniversalObject+RNBranch.h
//  ABI30_0_0RNBranch
//
//  Created by Jimmy Dee on 1/26/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import <Branch/Branch.h>

@class ABI30_0_0RNBranchProperty;

@interface BranchUniversalObject(ABI30_0_0RNBranch)

- (instancetype)initWithMap:(NSDictionary *)map;

- (void)setAutomaticallyListOnSpotlightWithNumber:(NSNumber *)automaticallyListOnSpotlight;
- (void)setContentIndexingMode:(NSString *)contentIndexingMode;
- (void)setExpirationDateWithString:(NSString *)expirationDate;
- (void)setPriceWithNumber:(NSNumber *)price;
- (void)setLocallyIndexWithNumber:(NSNumber *)locallyIndex;
- (void)setPubliclyIndexWithNumber:(NSNumber *)publiclyIndex;
- (void)setContentMetadataWithMap:(NSDictionary *)map;

@end
