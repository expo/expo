// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoFileSystem/EXSessionHandler.h>

#import <ExpoModulesCore/EXDefines.h>

@implementation EXSessionHandler

EX_REGISTER_SINGLETON_MODULE(SessionHandler);

- (void)invokeCompletionHandlerForSessionIdentifier:(NSString *)identifier
{
}

#pragma mark - AppDelegate

- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)(void))completionHandler
{
  // FileSystemBackgroundSessionHandler handles background sessions. EXLegacyAppDelegateWrapper still
  // forwards this event to this singleton module and waits for it, so complete at once.
  completionHandler();
}

@end
