//
//  ABI30_0_0RNBranchAgingItem.h
//  ABI30_0_0RNBranch
//
//  Created by Jimmy Dee on 3/8/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ABI30_0_0RNBranchAgingItem : NSObject

@property (nonatomic, readonly, nonnull) id item;
@property (nonatomic, readonly) NSTimeInterval accessTime;

- (instancetype _Nonnull)init NS_UNAVAILABLE;
- (instancetype _Nonnull) initWithItem:(id _Nonnull)item NS_DESIGNATED_INITIALIZER;

@end
