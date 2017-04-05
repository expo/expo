// Copyright 2015-present 650 Industries. All rights reserved.
//
//  Keeps track of experience error state, including between reloads, so that we can
//  pass error recovery info to an experience which just reloaded.
//

#import <Foundation/Foundation.h>

@interface EXErrorRecoveryManager : NSObject

/**
 *  Sometimes we need to keep a native reference to an EXFrame error that
 *  we want to sandbox to only that experience.
 *  For example, RCTJavaScriptDidFailToLoadNotification will also call RCTFatal(),
 *  but we don't want such an error to take down the entire kernel.
 */
- (void)setError: (NSError *)error forExperienceId: (NSString *)experienceId;
- (BOOL)errorBelongsToExperience: (NSError *)error;

- (void)experienceFinishedLoadingWithId:(NSString *)experienceId;

/**
 *  True if any bridge for this experience id had an error, and has not successfully loaded
 *  since the error was reported.
 */
- (BOOL)experienceIdIsRecoveringFromError:(NSString *)experienceId;

@end
