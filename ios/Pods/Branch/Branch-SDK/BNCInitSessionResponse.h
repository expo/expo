//
//  BNCInitSessionResponse.h
//  Branch
//
//  Created by Ernest Cho on 3/30/20.
//  Copyright © 2020 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "BranchUniversalObject.h"
#import "BranchLinkProperties.h"

NS_ASSUME_NONNULL_BEGIN

@interface BNCInitSessionResponse : NSObject

@property (nonatomic, strong, readwrite) NSDictionary *params;
@property (nonatomic, strong, readwrite) BranchUniversalObject *universalObject;
@property (nonatomic, strong, readwrite) BranchLinkProperties *linkProperties;

@property (nonatomic, copy, readwrite) NSString *sceneIdentifier;
@property (nonatomic, strong, readwrite) NSError *error;

@end

NS_ASSUME_NONNULL_END
