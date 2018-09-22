//
//  BranchView.h
//  Branch-TestBed
//
//  Created by Sojan P.R. on 3/4/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@interface BranchView : NSObject
//-------- properties-------------------//
/**
 Unique ID for this Branch view
 */
@property (strong, nonatomic) NSString *branchViewID;
/**
 User or Branch action associated with the Branch view
 */
@property (strong, nonatomic) NSString *branchViewAction;
/**
 Number of times this Branch view can be used
 */
@property (nonatomic) NSInteger numOfUse;
/**
 Web url to for showing html content for the Branch View
 */
@property (strong, nonatomic) NSString *webUrl;
/**
 Html content for loading the web view
 */
@property (strong, nonatomic) NSString *webHtml;

//---------- Methods---------------//
/**
 Initialises Branch View with the given dictionary
 */
- (id)initWithBranchView:(NSDictionary *)branchViewDict andActionName:(NSString *)actionName;
/**
 Check Branch view for usage limit
 */
- (BOOL)isAvailable;
/**
 update the usage count for this Branch view
 */
- (void)updateUsageCount;

@end
