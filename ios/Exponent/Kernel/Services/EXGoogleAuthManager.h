// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "EXGoogle.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSNotificationName kEXDidBeginOAuthFlowNotification DEPRECATED_ATTRIBUTE;

@interface EXGoogleAuthManager : NSObject <EXGoogleScopedModuleDelegate>

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(nullable NSString *)sourceApplication
         annotation:(id)annotation;

@end

NS_ASSUME_NONNULL_END
