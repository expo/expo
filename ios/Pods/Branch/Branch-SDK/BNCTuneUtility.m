//
//  BNCTuneUtility.m
//  Branch
//
//  Created by Ernest Cho on 10/4/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCTuneUtility.h"

@implementation BNCTuneUtility

// INTENG-7695 Tune data indicates an app upgrading from Tune SDK to Branch SDK
+ (BOOL)isTuneDataPresent {
    static BOOL isPresent = NO;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSString *tuneMatIdKey = @"_TUNE_mat_id";
        NSString *matId = [[NSUserDefaults standardUserDefaults] stringForKey:tuneMatIdKey];
        if (matId && [matId length] > 0) {
            isPresent = YES;
        }
    });
    return isPresent;
}

@end
