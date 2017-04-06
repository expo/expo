// Copyright 2015-present 650 Industries. All rights reserved.
//
//  Keeps track of experience error state, including between reloads, so that we can
//  pass error recovery info to an experience which just reloaded.
//

#import <Foundation/Foundation.h>

FOUNDATION_EXPORT NSNotificationName const kEXErrorRecoverySetPropsNotification;

@interface EXErrorRecoveryManager : NSObject

/**
 *  Associate arbitrary developer info with this experience id. If the experience recovers from an
 *  error, we can pass this info to the new instance of the experience.
 */
- (void)setDeveloperInfo: (NSDictionary *)developerInfo forExperienceid: (NSString *)experienceId;
- (NSDictionary *)developerInfoForExperienceId: (NSString *)experienceId;

/**
 *  Associate an error with an experience id. This will never be cleared until the next
 *  call to `experienceFinishedLoadingWithId:`.
 */
- (void)setError: (NSError *)error forExperienceId: (NSString *)experienceId;

/**
 *  Indicate that a new bridge has been constructed for this experience id.
 *  Clears all recovery info from previous runs of this experience id.
 */
- (void)experienceRestartedWithId:(NSString *)experienceId;

/**
 *  Indicate that a JS bundle has successfully loaded for this experience id.
 */
- (void)experienceFinishedLoadingWithId:(NSString *)experienceId;

/**
 *  True if any bridge for this experience id had an error, and has not successfully loaded
 *  since the error was reported.
 */
- (BOOL)experienceIdIsRecoveringFromError:(NSString *)experienceId;

/**
 *  True if this error object (by `isEqual:`) has been registered for any experience id.
 */
- (BOOL)errorBelongsToExperience: (NSError *)error;

/**
 *  Whether we want to auto-reload this experience if it encounters a fatal error.
 */
- (BOOL)experienceIdShouldReloadOnError: (NSString *)experienceId;

@end
