// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScreenOrientation.h"

FOUNDATION_EXPORT NSNotificationName kEXChangeForegroundTaskSupportedOrientationsNotification DEPRECATED_ATTRIBUTE;

@interface EXScreenOrientationManager : NSObject <EXScreenOrientationScopedModuleDelegate>

- (void)setSupportInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations
                         forExperienceId:(NSString *)experienceId;
- (void)setSupportedInterfaceOrientationsForForegroundExperience:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

@end
