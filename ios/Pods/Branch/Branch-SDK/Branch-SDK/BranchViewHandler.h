//
//  BNCViewHandler.h
//  Branch-TestBed
//
//  Created by Sojan P.R. on 3/3/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#import "BranchView.h"

@protocol BranchViewControllerDelegate <NSObject>

- (void)branchViewVisible:(NSString *)actionName withID:(NSString *)branchViewID;
- (void)branchViewAccepted:(NSString *)actionName withID:(NSString *)branchViewID;
- (void)branchViewCancelled:(NSString *)actionName withID:(NSString *)branchViewID;
- (void)branchViewErrorCode:(NSInteger)errorCode message:(NSString *)errorMsg actionName:(NSString *)actionName withID:(NSString *)branchViewID;
@end

@interface BranchViewHandler : NSObject
//---- Properties---------------//
/**
 Callback for Branch View events
 */
@property (nonatomic, assign) id  <BranchViewControllerDelegate> branchViewCallback;

//-- Methods--------------------//
/**
 Gets the global instance for BranchViewHandler.
 */
+ (BranchViewHandler *)getInstance;
/**
 Shows a Branch view for the given action if available
 */
- (BOOL)showBranchView:(NSString *)actionName withBranchViewDictionary:(NSDictionary*)branchViewDict andWithDelegate:(id)callback;

@end
