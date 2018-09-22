//
//  BNCStrongMatchHelper.h
//  Branch-TestBed
//
//  Created by Derrick Staten on 8/26/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@interface BNCStrongMatchHelper : NSObject

+ (BNCStrongMatchHelper *)strongMatchHelper;
- (void)createStrongMatchWithBranchKey:(NSString *)branchKey;
- (BOOL)shouldDelayInstallRequest;
+ (NSURL *)getUrlForCookieBasedMatchingWithBranchKey:(NSString *)branchKey
                                         redirectUrl:(NSString *)redirectUrl;

@end
