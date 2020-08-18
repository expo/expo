//
//  BranchLATDRequest.h
//  Branch
//
//  Created by Ernest Cho on 9/18/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "BNCServerRequest.h"

NS_ASSUME_NONNULL_BEGIN

@interface BranchLATDRequest : BNCServerRequest

@property (nonatomic, assign, readwrite) NSInteger attributionWindow;

@end

NS_ASSUME_NONNULL_END
