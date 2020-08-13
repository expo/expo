//
//  BranchCrossPlatformID.h
//  Branch
//
//  Created by Ernest Cho on 9/12/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "BNCServerInterface.h"

NS_ASSUME_NONNULL_BEGIN

@interface BranchProbabilisticCrossPlatformID : NSObject

@property (nonatomic, copy, readonly) NSString *crossPlatformID;
@property (nonatomic, copy, readonly) NSNumber *score;

+ (nullable BranchProbabilisticCrossPlatformID *)buildFromJSON:(NSDictionary *)json;

@end

@interface BranchCrossPlatformID : NSObject

@property (nonatomic, copy, readonly) NSString *crossPlatformID;
@property (nonatomic, copy, readonly) NSString *developerID;
@property (nonatomic, strong, readonly) NSArray<NSString *> *pastCrossPlatformIDs;
@property (nonatomic, strong, readonly) NSArray<BranchProbabilisticCrossPlatformID *> *probabiliticCrossPlatformIDs;

+ (nullable BranchCrossPlatformID *)buildFromJSON:(NSDictionary *)json;

+ (void)requestCrossPlatformIdData:(BNCServerInterface *)serverInterface key:(NSString *)key completion:(void(^) (BranchCrossPlatformID * _Nullable cpid))completion;

@end

NS_ASSUME_NONNULL_END
