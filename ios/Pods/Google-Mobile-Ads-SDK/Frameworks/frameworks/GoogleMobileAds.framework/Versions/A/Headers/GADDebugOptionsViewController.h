//
//  GADDebugOptionsViewController.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADDebugOptionsViewController;

GAD_ASSUME_NONNULL_BEGIN

/// Delegate for the GADDebugOptionsViewController.
@protocol GADDebugOptionsViewControllerDelegate<NSObject>
/// Called when the debug options flow is finished.
- (void)debugOptionsViewControllerDidDismiss:(GADDebugOptionsViewController *)controller;
@end

/// Displays debug options to the user.
@interface GADDebugOptionsViewController : UIViewController

/// Creates and returns a GADDebugOptionsViewController object initialized with the ad unit ID.
/// @param adUnitID An ad unit ID for the DFP account that is being configured with debug options.
+ (instancetype)debugOptionsViewControllerWithAdUnitID:(NSString *)adUnitID;

/// Delegate for the debug options view controller.
@property(nonatomic, weak, GAD_NULLABLE)
    IBOutlet id<GADDebugOptionsViewControllerDelegate> delegate;

@end

GAD_ASSUME_NONNULL_END
