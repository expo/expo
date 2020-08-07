//
//  BranchDelegate.h
//  Branch-SDK
//
//  Created by Edward Smith on 6/30/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

// TODO: Add documentation

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@class Branch, BranchUniversalObject, BranchLinkProperties, BranchLink;

#pragma mark BranchDelegate Protocol

@protocol BranchDelegate <NSObject>

@optional
- (void) branch:(Branch*_Nonnull)branch willStartSessionWithURL:(NSURL*_Nullable)url;

@optional
- (void) branch:(Branch*_Nonnull)branch
     didStartSessionWithURL:(NSURL*_Nullable)url
                 branchLink:(BranchLink*_Nullable)branchLink;

@optional
- (void) branch:(Branch*_Nonnull)branch
 failedToStartSessionWithURL:(NSURL*_Nullable)url
                       error:(NSError*_Nullable)error;
@end

#pragma mark - Branch Notifications

FOUNDATION_EXPORT NSString*_Nonnull const BranchWillStartSessionNotification;
FOUNDATION_EXPORT NSString*_Nonnull const BranchDidStartSessionNotification;

FOUNDATION_EXPORT NSString*_Nonnull const BranchErrorKey;
FOUNDATION_EXPORT NSString*_Nonnull const BranchURLKey;
FOUNDATION_EXPORT NSString*_Nonnull const BranchUniversalObjectKey;
FOUNDATION_EXPORT NSString*_Nonnull const BranchLinkPropertiesKey;
