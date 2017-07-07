// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScreenOrientation.h"

FOUNDATION_EXPORT NSNotificationName kEXChangeForegroundTaskSupportedOrientationsNotification DEPRECATED_ATTRIBUTE;

@interface EXScreenOrientationManager : NSObject <EXScreenOrientationScopedModuleDelegate>

- (void)setSupportInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations
                         forExperienceId:(NSString *)experienceId;

/**
 *  Similar to UIViewController::supportedInterfaceOrientations, but the value can vary depending on
 *  which JS task is visible.
 */
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientationsForForegroundExperience;

@end
