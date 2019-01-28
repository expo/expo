//
//  EXStoreReview.m
//  Exponent
//
//  Created by Evan Bacon on 4/17/18.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import "EXStoreReview.h"
#import <StoreKit/SKStoreReviewController.h>

@implementation EXStoreReview

RCT_EXPORT_MODULE(ExponentStoreReview);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"isSupported": [SKStoreReviewController class] ? @(YES) : @(NO)
           };
}

/*
 From Apple: https://developer.apple.com/ios/human-interface-guidelines/system-capabilities/ratings-and-reviews/
 
 Ask for a rating only after the user has demonstrated engagement with your app. For example, prompt the user upon the completion of a game level or productivity task. Never ask for a rating on first launch or during onboarding. Allow ample time to form an opinion.
 
 Don’t interrupt the user, especially when they’re performing a time-sensitive or stressful task. Look for logical pauses or stopping points, where a rating request makes the most sense.
 
 Don’t be a pest. Repeated rating prompts can be irritating, and may even negatively influence the user’s opinion of your app. Allow at least a week or two between rating requests and only prompt again after the user has demonstrated additional engagement with your app.
 */

RCT_EXPORT_METHOD(requestReview)
{
  if (@available(iOS 10.3, *)) {
    [SKStoreReviewController requestReview];
  }
}

@end
