//
//  BranchLastTouchAttributionData.h
//  Branch
//
//  Created by Ernest Cho on 9/13/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "BNCServerInterface.h"

NS_ASSUME_NONNULL_BEGIN

@interface BranchLastAttributedTouchData : NSObject

// free-form JSON
@property (nonatomic, strong, readonly) NSDictionary *lastAttributedTouchJSON;

@property (nonatomic, copy, readonly) NSNumber *attributionWindow;

+ (nullable BranchLastAttributedTouchData *)buildFromJSON:(NSDictionary *)json;

+ (void)requestLastTouchAttributedData:(BNCServerInterface *)serverInterface key:(NSString *)key attributionWindow:(NSInteger)window completion:(void(^) (BranchLastAttributedTouchData *latd))completion;

@end

NS_ASSUME_NONNULL_END
